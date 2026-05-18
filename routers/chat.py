from fastapi import APIRouter, UploadFile, File, Form
from models.schemas import ChatAction, ChatRequest, ChatResponse, DocumentReference
from services.agent import run_agent
from services.document_parser import parse_document
import tempfile
import os
import re

router = APIRouter()

def format_references(docs):
    references = []
    seen_sources = set()
    
    for doc in docs:
        meta = doc.get("metadata", {})
        source = meta.get("source", "Unknown file")
        
        # Deduplicate: skip if we have already added this filename
        if source in seen_sources:
            continue
        seen_sources.add(source)
        
        references.append(
            DocumentReference(
                file_name=meta.get("client_name", "N/A") + " | " + source if meta.get("client_name") else source,
                url=f"/files/{source}",
                summary=meta.get("summary", "No summary available"),
                metadata=meta
            )
        )
    return references

def is_ppt_generation_prompt(query: str) -> bool:
    normalized = query.lower()
    asks_for_deck = re.search(r"\b(ppt|powerpoint|presentation|slide deck|deck|slides)\b", normalized)
    asks_to_create = re.search(r"\b(generate|create|make|build|prepare|compile|draft)\b", normalized)
    return bool(asks_for_deck and asks_to_create)

def deck_topic_from_prompt(query: str) -> str:
    topic = re.sub(r"\b(generate|create|make|build|prepare|compile|draft)\b", "", query, flags=re.I)
    topic = re.sub(r"\b(a|an|the)?\s*(ppt|powerpoint|presentation|slide deck|deck|slides)\b", "", topic, flags=re.I)
    topic = re.sub(r"\s+", " ", topic).strip(" -:.,")
    return (topic or query or "AI Synthesis")[:60]

def actions_for_query(query: str):
    if not is_ppt_generation_prompt(query):
        return []
    topic = deck_topic_from_prompt(query)
    return [
        ChatAction(
            type="generate_ppt",
            topic=topic,
            label=f"Generate PowerPoint: {topic}",
            payload={"source": "chat_intent"},
        )
    ]

@router.post("/", response_model=ChatResponse)
async def handle_chat(request: ChatRequest):
    session_id = request.session_id or "default"
    result = run_agent(request.query, session_id=session_id)
    
    return ChatResponse(
        answer=result.get("final_answer", "Sorry, I couldn't process that request."),
        references=format_references(result.get("retrieved_docs", [])),
        actions=actions_for_query(request.query),
    )

@router.post("/with-context", response_model=ChatResponse)
async def handle_chat_with_context(
    query: str = Form(...),
    session_id: str = Form("default"),
    file: UploadFile = File(...)
):
    """Allows uploading a SOW or Email (Word doc, PDF, txt) to contextualize the query."""
    
    # Save temp file
    temp_dir = tempfile.gettempdir()
    temp_path = os.path.join(temp_dir, file.filename)
    
    with open(temp_path, "wb") as f:
        f.write(await file.read())
        
    # Extract text from the uploaded SOW/Email
    parsed = parse_document(temp_path)
    context_text = parsed.get("text", "")
    
    # Clean up temp file
    if os.path.exists(temp_path):
        os.remove(temp_path)
    
    # Run the LangGraph agent with the SOW context
    result = run_agent(query, session_id=session_id, context_text=context_text)
    
    return ChatResponse(
        answer=result.get("final_answer", "Sorry, I couldn't process that request."),
        references=format_references(result.get("retrieved_docs", [])),
        actions=actions_for_query(query),
    )
