from fastapi import APIRouter, UploadFile, File, Form
from models.schemas import ChatRequest, ChatResponse, DocumentReference
from services.agent import run_agent
from services.document_parser import parse_document
import tempfile
import os

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

@router.post("/", response_model=ChatResponse)
async def handle_chat(request: ChatRequest):
    session_id = request.session_id or "default"
    result = run_agent(request.query, session_id=session_id)
    
    return ChatResponse(
        answer=result.get("final_answer", "Sorry, I couldn't process that request."),
        references=format_references(result.get("retrieved_docs", []))
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
        references=format_references(result.get("retrieved_docs", []))
    )
