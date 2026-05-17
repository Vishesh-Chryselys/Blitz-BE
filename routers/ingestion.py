import os
from fastapi import APIRouter, BackgroundTasks
from models.schemas import IngestionRequest
from services.document_parser import parse_document
from services.llm import extract_metadata_from_text
from services.vectorstore import upsert_documents
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

router = APIRouter()

def process_ingestion(folder_path: str):
    print(f"Starting ingestion for {folder_path}...")
    if not os.path.exists(folder_path):
        print(f"Folder '{folder_path}' not found.")
        return

    documents_to_upsert = []
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)

    for root, _, files in os.walk(folder_path):
        for file in files:
            file_path = os.path.join(root, file)
            print(f"Processing: {file_path}")
            
            # 1. Parse Document
            parsed = parse_document(file_path)
            text = parsed.get("text", "")
            if not text.strip():
                continue
                
            # 2. Extract Metadata via LLM
            llm_metadata = extract_metadata_from_text(text, file)
            
            # Combine standard metadata with LLM metadata
            final_metadata = {
                "source": file,
                "file_type": parsed.get("type", "unknown"),
                "topic": llm_metadata.get("topic", "General"),
                "summary": llm_metadata.get("summary", ""),
                "created_by": llm_metadata.get("created_by", "Unknown")
            }
            # Flatten subtopics for Pinecone compatibility
            subtopics = llm_metadata.get("subtopics", [])
            if isinstance(subtopics, list):
                final_metadata["subtopics"] = ", ".join(subtopics)

            # 3. Chunk Text
            chunks = text_splitter.split_text(text)
            
            for chunk in chunks:
                doc = Document(page_content=chunk, metadata=final_metadata)
                documents_to_upsert.append(doc)
                
    if documents_to_upsert:
        # 4. Upsert to Pinecone
        upsert_documents(documents_to_upsert)
        print("Ingestion complete.")
    else:
        print("No documents were processed.")

@router.post("/")
async def trigger_ingestion(request: IngestionRequest, background_tasks: BackgroundTasks):
    # Runs the heavy ingestion job in a background thread so the API responds immediately
    background_tasks.add_task(process_ingestion, request.folder_path)
    return {"status": "success", "message": f"Ingestion started in background for folder: {request.folder_path}"}
