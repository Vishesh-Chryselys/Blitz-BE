from typing import TypedDict, List, Dict, Optional
from langgraph.graph import StateGraph, END
from services.llm import get_llm, get_generator_llm
from services.reranker import rerank_documents
from services.vectorstore import get_vectorstore
from services.poc_lookup import resolve_poc
import json
import os
import re

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

def _normalize_lookup_text(value: str) -> str:
    value = re.sub(r"\([^)]*\)", " ", value.lower())
    value = re.sub(r"\bclient\b|\bus\b|\buk\b|\beu\b", " ", value)
    return re.sub(r"[^a-z0-9]+", " ", value).strip()

def _load_client_candidates() -> Dict[str, str]:
    """Builds cheap client-name match candidates from the local ingestion manifest."""
    manifest_path = os.path.join(os.getcwd(), "indexed_files.json")
    candidates = {}
    if not os.path.exists(manifest_path):
        return candidates

    try:
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)
    except Exception as e:
        print(f"Client candidate load failed: {e}")
        return candidates

    for entry in manifest.values():
        client = entry.get("client")
        if not client:
            continue
        normalized = _normalize_lookup_text(client)
        if normalized:
            candidates[normalized] = client
        for part in re.split(r"[-_/]", client):
            normalized_part = _normalize_lookup_text(part)
            if len(normalized_part) >= 3:
                candidates[normalized_part] = client

    return candidates

def _extract_metadata_filters(query: str) -> dict:
    """Fast path for client filters without paying for an orchestrator LLM call."""
    normalized_query = f" {_normalize_lookup_text(query)} "
    for candidate, client in sorted(_load_client_candidates().items(), key=lambda item: len(item[0]), reverse=True):
        if f" {candidate} " in normalized_query:
            return {"client_name": client}
    return {}

def _query_terms(query: str) -> set:
    stopwords = {
        "the", "and", "for", "with", "that", "this", "have", "has", "done", "what",
        "all", "can", "you", "our", "are", "was", "were", "from", "into", "ppt",
        "deck", "slides", "presentation", "generate", "create", "make", "build",
    }
    return {
        term for term in re.findall(r"[a-zA-Z0-9]{3,}", query.lower())
        if term not in stopwords
    }

def _doc_relevance_score(doc: dict, query_terms: set, client_filter: str = "") -> float:
    metadata = doc.get("metadata", {})
    haystack = " ".join([
        str(metadata.get("source", "")),
        str(metadata.get("client_name", "")),
        str(metadata.get("topic", "")),
        str(metadata.get("summary", "")),
        str(metadata.get("business_objective", "")),
        str(metadata.get("approach", "")),
        str(metadata.get("key_outcome", "")),
        str(doc.get("content", ""))[:1200],
    ]).lower()

    score = 0.0
    for term in query_terms:
        if term in haystack:
            score += 1.0

    if client_filter:
        doc_client = str(metadata.get("client_name", "")).lower()
        doc_source = str(metadata.get("source", "")).lower()
        if client_filter in doc_client or client_filter in doc_source:
            score += 6.0

    if metadata.get("summary"):
        score += 0.5
    if metadata.get("key_outcome") and metadata.get("key_outcome") != "Not extracted":
        score += 0.8
    if metadata.get("business_objective") and metadata.get("business_objective") != "Not extracted":
        score += 0.6

    return score

def _trim_content(content: str, max_chars: int = 850) -> str:
    content = re.sub(r"\s+", " ", content or "").strip()
    if len(content) <= max_chars:
        return content
    return content[:max_chars].rsplit(" ", 1)[0] + "..."

def _format_doc_context(docs: List[dict]) -> str:
    packets = []
    for i, d in enumerate(docs):
        meta = d.get("metadata", {})
        poc = resolve_poc(meta.get("pocs", "Unknown"), meta.get("topic", ""), meta.get("client_name", ""))
        packets.append(
            f"[Doc {i+1}]\n"
            f"Source: {meta.get('source', 'Unknown')}\n"
            f"Client: {meta.get('client_name', 'N/A')}\n"
            f"Topic: {meta.get('topic', 'N/A')}\n"
            f"Brand: {meta.get('brand', 'N/A')}\n"
            f"POC: {poc}\n"
            f"Business Objective: {meta.get('business_objective', 'N/A')}\n"
            f"Approach: {meta.get('approach', 'N/A')}\n"
            f"Datasets Used: {meta.get('datasets_used', 'N/A')}\n"
            f"Key Outcome: {meta.get('key_outcome', 'N/A')}\n"
            f"Evidence Snippet: {_trim_content(d.get('content', ''), 850)}"
        )
    return "\n\n".join(packets)

def orchestrator_node(state: AgentState):
    """AGENT 1: The Business Analyst Orchestrator. Analyzes the query and extracts metadata entities."""
    filters = _extract_metadata_filters(state["query"])
    if filters:
        print(f"Orchestrator fast-path metadata filters: {filters}")
        return {"metadata_filters": filters}

    # Most questions do not need a separate LLM classification step. Skipping it
    # keeps normal RAG turns to retrieval + final generation.
    return {"metadata_filters": {}}

def llm_orchestrator_node(state: AgentState):
    """Optional LLM fallback for metadata extraction if stricter routing is needed later."""
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

def _cap_chunks_per_source(docs: List[dict], max_per_source: int = 3, total_cap: int = 8) -> List[dict]:
    """Keep order intact but enforce at most `max_per_source` chunks per source file."""
    per_source: Dict[str, int] = {}
    capped: List[dict] = []
    for doc in docs:
        src = doc.get("metadata", {}).get("source", "unknown")
        if per_source.get(src, 0) >= max_per_source:
            continue
        per_source[src] = per_source.get(src, 0) + 1
        capped.append(doc)
        if len(capped) >= total_cap:
            break
    return capped


def retriever_node(state: AgentState):
    """AGENT 2: The Knowledge Librarian. Pinecone recall + Bedrock rerank, client-boosted, multi-chunk."""
    try:
        search_query = state["query"]
        shared_store = get_vectorstore(namespace="knowledge_base")

        metadata_filters = state.get("metadata_filters", {})
        client_filter = metadata_filters.get("client_name", "").lower()
        query_terms = _query_terms(search_query)

        # 1. Broad recall from Pinecone
        print(f"Fetching candidate matches for query: '{search_query}'...")
        candidate_docs = shared_store.similarity_search(search_query, k=30)

        payloads: List[dict] = []
        for doc in candidate_docs:
            payload = {"content": doc.page_content, "metadata": dict(doc.metadata or {})}
            payload["metadata"]["relevance_score"] = _doc_relevance_score(payload, query_terms, client_filter)
            payloads.append(payload)

        # 2. Bedrock rerank against the original query — supersedes the keyword heuristic for ordering
        reranked = rerank_documents(search_query, payloads, top_n=15)

        # 3. Client boost: if the orchestrator detected a client, float its docs to the top while
        #    preserving rerank order within each group.
        if client_filter:
            boosted, other = [], []
            for doc in reranked:
                meta = doc.get("metadata", {})
                doc_client = str(meta.get("client_name", "")).lower()
                doc_source = str(meta.get("source", "")).lower()
                if client_filter in doc_client or client_filter in doc_source:
                    boosted.append(doc)
                else:
                    other.append(doc)
            ordered = boosted + other
            strategy = "hybrid_boosted" if boosted else "rerank_only"
        else:
            ordered = reranked
            strategy = "rerank_only"

        # 4. Allow up to 3 chunks per source file, hard cap at 8 docs sent to the generator
        final_docs = _cap_chunks_per_source(ordered, max_per_source=3, total_cap=8)

        print(
            f"Retriever: {len(final_docs)} chunks across "
            f"{len({d.get('metadata', {}).get('source') for d in final_docs})} files "
            f"using {strategy} (from {len(candidate_docs)} candidates)"
        )

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

def generator_node_v2(state: AgentState):
    """Generates concise, evidence-grounded answers from ranked context packets."""
    if state.get("final_answer"):
        return state

    try:
        llm = get_generator_llm()
        docs = state.get("retrieved_docs", [])

        if not docs:
            return {"final_answer": "I couldn't find any relevant documents in the knowledge base."}

        context = _format_doc_context(docs)
        history_str = "\n".join([f"{msg['role']}: {msg['content']}" for msg in state.get("chat_history", [])[-4:]])
        strategy_note = ""
        if state.get("retrieval_strategy") == "hybrid_boosted":
            strategy_note = "The retrieved context was boosted for the detected client/brand."

        prompt = f"""You are BLITZ, Chryselys' enterprise knowledge assistant for sales enablement.
Answer the user's question using ONLY the Retrieved Knowledge Base Context.

QUALITY RULES:
1. Be direct and specific. Do not start with generic phrases like "The retrieved documents provide".
2. If the user asks about a client, lead with what Chryselys did for that client and the concrete deliverables/outcomes.
3. If the user asks for capabilities, group the answer by capability area and connect each area to evidence.
4. Every factual claim about work performed, deliverables, datasets, outcomes, or POCs must cite one or more docs like [Doc 1].
5. Do not invent facts. If a field is missing, say "not specified in the indexed material" instead of guessing.
6. Prefer concise bullets over long paragraphs. Keep the answer useful for a sales/delivery user.
7. Include POCs when present, formatted as **POC:** Name.
8. End with a short "Sources referenced" list containing filename, client, and POC.

RESPONSE SHAPE:
- Start with a 2-3 sentence direct answer.
- Then provide 3-6 bullets or grouped sections depending on the query.
- For client/capability questions, include deliverables, approach, datasets/tools, outcomes, and POCs when available.
- End with "Sources referenced:".

{strategy_note}

Conversation Summary: {state.get("summary", "None")}
Recent History:
{history_str}

User Uploaded SOW/Email Context:
{str(state.get("context_text", "None"))[:1800]}

Retrieved Knowledge Base Context ({len(docs)} documents):
{context}

Current Query: {state["query"]}

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
    workflow.add_node("generator", generator_node_v2)
    
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
