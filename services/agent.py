from typing import TypedDict, List, Dict, Optional
from langgraph.graph import StateGraph, END
from services.llm import get_llm
from services.vectorstore import get_vectorstore

class AgentState(TypedDict):
    query: str
    chat_history: List[Dict[str, str]]
    summary: str
    context_text: Optional[str] # For uploaded SOW/Emails
    retrieved_docs: List[dict]
    evaluation_score: str
    final_answer: str
    retry_count: int

# In-memory store for hackathon purposes
SESSION_STORE = {}

def get_session_data(session_id: str):
    if session_id not in SESSION_STORE:
        SESSION_STORE[session_id] = {"chat_history": [], "summary": ""}
    return SESSION_STORE[session_id]

def save_session_data(session_id: str, history: List[dict], summary: str):
    SESSION_STORE[session_id] = {"chat_history": history, "summary": summary}

def orchestrator_node(state: AgentState):
    """Analyzes the query and routes it."""
    return state

def retriever_node(state: AgentState):
    """Retrieves documents from Pinecone."""
    try:
        vectorstore = get_vectorstore()
        
        # Mix the summary, uploaded SOW context, and the query for better semantic search
        search_query = state['query']
        if state.get('summary'):
            search_query = f"{state['summary']} {search_query}"
        if state.get('context_text'):
            # Use a chunk of the SOW to find matching collateral
            search_query = f"SOW Context: {state['context_text'][:1000]} {search_query}"
            
        docs = vectorstore.similarity_search(search_query, k=5)
        
        formatted_docs = [{"content": d.page_content, "metadata": d.metadata} for d in docs]
        return {"retrieved_docs": formatted_docs}
    except Exception as e:
        print(f"Retrieval Error: {e}")
        return {"retrieved_docs": []}

def evaluator_node(state: AgentState):
    """Evaluates if the retrieved docs contain the answer."""
    docs = state.get("retrieved_docs", [])
    if not docs and state.get("retry_count", 0) < 1:
        return {"evaluation_score": "FAIL"}
        
    try:
        llm = get_llm()
        doc_text = "\n".join([d["content"] for d in docs])
        prompt = f"Does the following context answer this query?\nQuery: {state['query']}\nContext: {doc_text}\nAnswer 'YES' or 'NO'."
        res = llm.invoke(prompt).content.strip().upper()
        
        if "NO" in res and state.get("retry_count", 0) < 1:
            return {"evaluation_score": "FAIL"}
        return {"evaluation_score": "PASS"}
    except Exception:
        return {"evaluation_score": "PASS"}

def fallback_node(state: AgentState):
    """Reformulates the query for broader search if initial retrieval failed."""
    try:
        llm = get_llm()
        prompt = f"Reformulate this query to be broader for a vector database search, keeping this summary context in mind:\nSummary: {state.get('summary')}\nSOW: {str(state.get('context_text'))[:500]}\nQuery: {state['query']}"
        new_query = llm.invoke(prompt).content.strip()
        return {"query": new_query, "retry_count": state.get("retry_count", 0) + 1}
    except:
        return {"retry_count": state.get("retry_count", 0) + 1}

def generator_node(state: AgentState):
    """Generates the final answer using the retrieved context and memory."""
    try:
        llm = get_llm()
        docs = state.get("retrieved_docs", [])
        
        if not docs:
            return {"final_answer": "I couldn't find any relevant documents in the knowledge base."}
            
        context = "".join([f"\n[Doc {i+1}] Source: {d.get('metadata', {}).get('source', 'Unknown')}\n{d['content']}\n" for i, d in enumerate(docs)])
        
        history_str = "\n".join([f"{msg['role']}: {msg['content']}" for msg in state.get('chat_history', [])])
        
        prompt = f"""You are an AI Knowledge Engine for Sales Enablement.
Use the context to answer the user's query. Cite document numbers [Doc X] when used. 

Conversation Summary: {state.get('summary', 'None')}
Recent History:
{history_str}

User Uploaded SOW/Email Context:
{str(state.get('context_text', 'None'))[:3000]}

Retrieved Knowledge Base Context:
{context}

Current Query: {state['query']}

Answer professionally:"""

        answer = llm.invoke(prompt).content
        return {"final_answer": answer}
    except Exception as e:
        print(f"Generation Error: {e}")
        return {"final_answer": "An error occurred while generating the answer."}

def build_graph():
    workflow = StateGraph(AgentState)
    workflow.add_node("orchestrator", orchestrator_node)
    workflow.add_node("retriever", retriever_node)
    workflow.add_node("evaluator", evaluator_node)
    workflow.add_node("fallback", fallback_node)
    workflow.add_node("generator", generator_node)
    
    workflow.set_entry_point("orchestrator")
    workflow.add_edge("orchestrator", "retriever")
    workflow.add_edge("retriever", "evaluator")
    
    workflow.add_conditional_edges("evaluator", lambda state: "fallback" if state.get("evaluation_score") == "FAIL" else "generator")
    workflow.add_edge("fallback", "retriever") 
    workflow.add_edge("generator", END)
    
    return workflow.compile()

agent_executor = build_graph()

def run_agent(query: str, session_id: str = "default", context_text: str = None):
    # 1. Load memory
    session_data = get_session_data(session_id)
    history = session_data["chat_history"]
    summary = session_data["summary"]
    
    # 2. Compress history if > 4 items (last 2 Q&A pairs)
    if len(history) > 4:
        try:
            llm = get_llm()
            msgs_to_summarize = "\n".join([f"{m['role']}: {m['content']}" for m in history[:-4]])
            history = history[-4:] # Keep last 4
            prompt = f"Summarize this conversation briefly:\nPrevious Summary: {summary}\nOlder Messages: {msgs_to_summarize}\nProvide a concise updated summary."
            summary = llm.invoke(prompt).content
        except Exception as e:
            print(f"Summarization Error: {e}")
            
    # Append new user message
    history.append({"role": "user", "content": query})
    
    initial_state = {
        "query": query,
        "chat_history": history,
        "summary": summary,
        "context_text": context_text,
        "retrieved_docs": [],
        "evaluation_score": "",
        "final_answer": "",
        "retry_count": 0
    }
    
    # 3. Run Agent
    result = agent_executor.invoke(initial_state)
    
    # 4. Save memory
    final_answer = result.get("final_answer", "")
    history.append({"role": "assistant", "content": final_answer})
    save_session_data(session_id, history, summary)
    
    return result
