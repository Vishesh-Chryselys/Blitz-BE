from typing import TypedDict, List, Dict, Optional
from langgraph.graph import StateGraph, END
from services.llm import get_llm
from services.vectorstore import get_vectorstore
from services.poc_lookup import resolve_poc
import json
import os

class AgentState(TypedDict):
    query: str
    chat_history: List[Dict[str, str]]
    summary: str
    context_text: Optional[str] # For uploaded SOW/Emails
    metadata_filters: dict # Extracted by Orchestrator
    retrieval_strategy: str # 'metadata' or 'semantic'
    retrieved_docs: List[dict]
    evaluation_score: str
    final_answer: str
    retry_count: int
    session_id: Optional[str] # Isolates user search spaces

# In-memory store for hackathon purposes
SESSION_STORE = {}

def get_session_data(session_id: str):
    if session_id not in SESSION_STORE:
        SESSION_STORE[session_id] = {"chat_history": [], "summary": ""}
    return SESSION_STORE[session_id]

def save_session_data(session_id: str, history: List[dict], summary: str):
    SESSION_STORE[session_id] = {"chat_history": history, "summary": summary}

def orchestrator_node(state: AgentState):
    """AGENT 1: The Business Analyst Orchestrator. Analyzes the query and extracts metadata entities."""
    try:
        llm = get_llm()
        prompt = f"""You are the Lead Business Analyst Orchestrator. 
Analyze the following user query and extract any potential metadata filters.
We have documents tagged with 'client_name' (e.g. Stemline, Pfizer, Novartis, etc).

CRITICAL RULE:
- Only extract actual CLIENT or COMPANY names (like Stemline, Pfizer, Novartis, Biolumina).
- DO NOT extract medical conditions, diseases, or therapeutic areas (such as IgAN, IgA Nephropathy, oncology, rare disease) as client names.

If the user mentions a specific client, output a JSON dictionary with 'client_name' as the key.
For example, if query is "what info do you have on stemline", output: {{"client_name": "stemline"}}
If no specific client is mentioned, output an empty dictionary {{}}.
Output ONLY valid JSON, nothing else.

Query: {state['query']}
"""
        response = llm.invoke(prompt).content.strip()
        if response.startswith("```json"):
            response = response[7:-3].strip()
        elif response.startswith("```"):
            response = response[3:-3].strip()
            
        filters = json.loads(response)
        return {"metadata_filters": filters}
    except Exception as e:
        print(f"Orchestrator extraction failed: {e}")
        return {"metadata_filters": {}}

def retriever_node(state: AgentState):
    """AGENT 2: The Knowledge Librarian. Hybrid retrieval with source-file diversity."""
    try:
        search_query = state["query"]
        # Always search the shared knowledge base namespace — matches ingestion target
        shared_store = get_vectorstore(namespace="knowledge_base")
        
        # Extract metadata terms from Orchestrator
        metadata_filters = state.get("metadata_filters", {})
        client_filter = metadata_filters.get("client_name", "").lower()
        
        # 1. Fetch a broad pool — large k to ensure we surface chunks from many unique files
        print(f"Fetching candidate matches for query: '{search_query}'...")
        candidate_docs = shared_store.similarity_search(search_query, k=30)
        
        boosted_docs = []
        other_docs = []
        
        for doc in candidate_docs:
            doc_client = doc.metadata.get("client_name", "").lower() if doc.metadata.get("client_name") else ""
            doc_source = doc.metadata.get("source", "").lower() if doc.metadata.get("source") else ""
            
            if client_filter and (client_filter in doc_client or client_filter in doc_source):
                boosted_docs.append({"content": doc.page_content, "metadata": doc.metadata})
            else:
                other_docs.append({"content": doc.page_content, "metadata": doc.metadata})
        
        # 2. Deduplicate: Keep ONE best chunk per unique source file for diversity
        def deduplicate_by_source(doc_list, max_results=8):
            seen_sources = set()
            unique_docs = []
            for doc in doc_list:
                src = doc.get("metadata", {}).get("source", "unknown")
                if src not in seen_sources:
                    seen_sources.add(src)
                    unique_docs.append(doc)
                if len(unique_docs) >= max_results:
                    break
            return unique_docs
        
        # Deduplicate each pool, then merge (client-boosted first)
        unique_boosted = deduplicate_by_source(boosted_docs, max_results=8)
        unique_other = deduplicate_by_source(other_docs, max_results=5)
        
        # For client queries: use all unique client docs; for general: top 5 diverse results
        if client_filter and unique_boosted:
            final_docs = unique_boosted  # All unique files from that client folder
        else:
            final_docs = (unique_boosted + unique_other)[:5]
        
        strategy = "hybrid_boosted" if boosted_docs else "pure_semantic"
        print(f"Hybrid Retriever: {len(final_docs)} unique-source docs using {strategy} (from {len(candidate_docs)} candidates)")
        
        return {"retrieved_docs": final_docs, "retrieval_strategy": strategy}
        
    except Exception as e:
        print(f"Retrieval Error: {e}")
        return {"retrieved_docs": []}

def fallback_node(state: AgentState):
    """AGENT 4: The Recovery Specialist. Handles unanswerable queries gracefully."""
    if state.get("retry_count", 0) == 0:
        try:
            llm = get_llm()
            prompt = f"Reformulate this query to be broader for a vector database search:\nQuery: {state['query']}"
            new_query = llm.invoke(prompt).content.strip()
            return {"query": new_query, "retry_count": 1}
        except:
            return {"retry_count": 1}
    else:
        # Final failure recovery
        return {"final_answer": "I apologize, but after performing both a strict metadata scan and a broad semantic search, I could not find specific information related to your query in our knowledge base.", "evaluation_score": "PASS"}

def generator_node(state: AgentState):
    """AGENT 3 (Generator): Generates the final answer using rich project intelligence metadata."""
    if state.get("final_answer"):
        return state
        
    try:
        llm = get_llm()
        docs = state.get("retrieved_docs", [])
        
        if not docs:
            return {"final_answer": "I couldn't find any relevant documents in the knowledge base."}
        
        # Build rich context — dynamically resolve POC at query time so
        # even old (pre-POC-feature) vectors get correctly tagged
        context = "\n".join([
            f"[Doc {i+1}]\n"
            f"  Source: {d.get('metadata', {}).get('source', 'Unknown')}\n"
            f"  Client: {d.get('metadata', {}).get('client_name', 'N/A')}\n"
            f"  Brand: {d.get('metadata', {}).get('brand', 'N/A')}\n"
            f"  POC: {resolve_poc(d.get('metadata', {}).get('pocs', 'Unknown'), d.get('metadata', {}).get('topic', ''), d.get('metadata', {}).get('client_name', ''))}\n"
            f"  Business Objective: {d.get('metadata', {}).get('business_objective', 'N/A')}\n"
            f"  Approach: {d.get('metadata', {}).get('approach', 'N/A')}\n"
            f"  Datasets Used: {d.get('metadata', {}).get('datasets_used', 'N/A')}\n"
            f"  Key Outcome: {d.get('metadata', {}).get('key_outcome', 'N/A')}\n"
            f"  Case Study: {d.get('metadata', {}).get('case_study', 'None')}\n"
            f"  Timeline/Pricing: {d.get('metadata', {}).get('timeline_pricing', 'Not mentioned')}\n"
            f"  Content:\n{d['content']}"
            for i, d in enumerate(docs)
        ])

        history_str = "\n".join([f"{msg['role']}: {msg['content']}" for msg in state.get('chat_history', [])])
        strategy_note = ""
        if state.get("retrieval_strategy") == "hybrid_boosted":
            strategy_note = "Note: Documents have been specifically boosted for this client/brand."

        prompt = f"""You are AIVY, an AI Knowledge Engine for Chryselys Sales Enablement.
Chryselys is a pharma analytics and sales enablement consulting firm that has worked with multiple pharma clients.

CRITICAL RESPONSE STYLE RULES:
1. Answer ONLY using the Retrieved Knowledge Base Context provided below.
2. You MUST write responses as a FIRST-PERSON KNOWLEDGE AGENT speaking on behalf of Chryselys — not as someone summarizing documents.
3. NEVER start with "The retrieved documents provide..." — that is FORBIDDEN.
4. Instead, ALWAYS start the Summary section with: "Yes, Chryselys has done work in this area." followed by a brief confirmation of what was done.

5. Determine query type and adjust content:
   - IF ASKING ABOUT A CLIENT (e.g., Stemline, Pfizer): Start with "This was done for [Client Name]." then list all work done for them.
   - IF ASKING ABOUT A BRAND (e.g., Elzonris, Nemplera): Describe the brand and all projects done for it.
   - OTHERWISE: Answer the topic directly in first-person Chryselys voice.

6. Your response MUST follow this exact 5-part format with these exact **bolded** headings:

   **Summary:** Start with "Yes, Chryselys has done work in this area." — then in 2-3 sentences: what was done, for which client/brand, and the overall business purpose.

   **Our Approach:** Explain the analytical or strategic methodology Chryselys used (from the 'approach' and 'business_objective' fields in the context).

   **Datasets & Tools:** List the data sources, datasets, or tools used in this work (from 'datasets_used').

   **Key Outcomes:** What were the actual results and deliverables achieved? (from 'key_outcome'). Also mention the POC name(s) if available (from 'pocs' field) and you MUST wrap the POC name in bold like this: **POC: John Doe**.

   **Conclusion:** A confident closing statement summarizing Chryselys' capability in this area and how it can be leveraged for future clients.

   **Sources referenced:**
   - [Doc 1] filename_here.pptx | Client: X | POC: Y
   - [Doc 2] filename_here.xlsx | Client: X | POC: Y

7. In "Sources referenced", include the filename, client name, AND POC for each document. List every document individually.
8. Throughout the text, reference documents like [Doc 1], [Doc 2] individually — NEVER group like "[Doc 1-3]".
9. Be highly specific, professional, and data-driven in tone.
{strategy_note}

Conversation Summary: {state.get('summary', 'None')}
Recent History:
{history_str}

User Uploaded SOW/Email Context:
{str(state.get('context_text', 'None'))[:3000]}

Retrieved Knowledge Base Context ({len(docs)} documents):
{context}

Current Query: {state['query']}

Answer:"""

        answer = llm.invoke(prompt).content
        return {"final_answer": answer}
    except Exception as e:
        print(f"Generation Error: {e}")
        return {"final_answer": "An error occurred while generating the answer."}

def build_graph():
    workflow = StateGraph(AgentState)
    workflow.add_node("orchestrator", orchestrator_node)
    workflow.add_node("retriever", retriever_node)
    workflow.add_node("fallback", fallback_node)
    workflow.add_node("generator", generator_node)
    
    workflow.set_entry_point("orchestrator")
    workflow.add_edge("orchestrator", "retriever")
    
    # Fast conditional edge: skip evaluator LLM, just check if we have docs
    workflow.add_conditional_edges("retriever", lambda state: "fallback" if not state.get("retrieved_docs") else "generator")
    
    workflow.add_edge("fallback", "retriever") 
    workflow.add_edge("generator", END)
    
    return workflow.compile()

agent_executor = build_graph()

USERS_MASTER_FILE = "users_master.json"

def register_user_in_master(session_id: str, query: str):
    """Registers the active Chryselys User ID inside our local master registry."""
    try:
        user_id = session_id.replace("session_", "")
        
        # Load existing registry
        registry = {}
        if os.path.exists(USERS_MASTER_FILE):
            with open(USERS_MASTER_FILE, "r", encoding="utf-8") as f:
                registry = json.load(f)
                
        # Register if new user
        if user_id not in registry:
            registry[user_id] = {
                "user_id": user_id,
                "first_seen": "2026-05-17T18:08:00Z",
                "pinecone_namespace": session_id,
                "last_query": query
            }
            
            with open(USERS_MASTER_FILE, "w", encoding="utf-8") as f:
                json.dump(registry, f, indent=4)
            print(f"Registered new user {user_id} in users_master.json!")
    except Exception as e:
        print(f"Error registering user in master: {e}")

def run_agent(query: str, session_id: str = "default", context_text: str = None):
    # 0. Register user in master dataset
    register_user_in_master(session_id, query)

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
        "retry_count": 0,
        "session_id": session_id
    }
    
    # 3. Run Agent
    result = agent_executor.invoke(initial_state)
    
    # 4. Save memory
    final_answer = result.get("final_answer", "")
    history.append({"role": "assistant", "content": final_answer})
    save_session_data(session_id, history, summary)
    
    return result
