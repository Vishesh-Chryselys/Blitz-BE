import os
from fastapi import APIRouter, BackgroundTasks
from models.schemas import IngestionRequest
from services.document_parser import parse_document
from services.llm import extract_metadata_from_text
from services.vectorstore import upsert_documents
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

router = APIRouter()

from services.poc_lookup import resolve_poc  # Shared POC table + resolver


def _extract_client_name(root: str, base_folder: str) -> str:
    """
    Derives a client name from the per-file root directory path during os.walk.
    Looks for the deepest folder segment that starts with 'client',
    otherwise falls back to the first non-trivial subfolder of base_folder.

    Example:
        root       = '.../Data/Project Deliverables Repository/Client - Stemline (US)/Ors growth drivers'
        base_folder= '.../Data/Project Deliverables Repository'
        -> returns 'Client - Stemline (US)'
    """
    rel = os.path.relpath(root, base_folder)
    parts = [p for p in rel.split(os.sep) if p and p != "."]
    # Walk parts looking for an explicit client folder marker
    for part in parts:
        if part.lower().startswith("client"):
            return part
    # Fall back to the first meaningful subfolder
    if parts:
        return parts[0]
    return "Shared"


def process_ingestion(folder_path: str, namespace: str = "default"):
    import json
    
    print(f"Starting ingestion for {folder_path} inside namespace {namespace}...")
    if not os.path.exists(folder_path):
        print(f"Folder '{folder_path}' not found.")
        return

    documents_to_upsert = []
    manifest_entries = {}
    
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)

    for root, _, files in os.walk(folder_path):
        # Derive client name per directory level from the walk root
        client_name = _extract_client_name(root, folder_path)

        for file in files:
            file_path = os.path.join(root, file)
            print(f"Processing [{client_name}]: {file}")

            # 1. Parse Document
            parsed = parse_document(file_path)
            text = parsed.get("text", "")
            if not text.strip():
                print(f"  -> Skipped (no text extracted): {file}")
                continue

            # 2. Extract Metadata via LLM
            llm_metadata = extract_metadata_from_text(text, file)

            # 3. Resolve final POC by merging LLM extraction + POC lookup table
            resolved_poc = resolve_poc(
                llm_extracted_pocs=llm_metadata.get("pocs", "Unknown"),
                topic=llm_metadata.get("topic", ""),
                client_name=client_name
            )
            print(f"  -> Resolved POC: {resolved_poc}")

            # 4. Build metadata dict — include client_name so retrieval is client-aware
            rel_path = os.path.relpath(file_path, folder_path)
            final_metadata = {
                "source": file,
                "source_path": rel_path,
                "client_name": client_name,
                "file_type": parsed.get("type", "unknown"),
                "topic": llm_metadata.get("topic", "General"),
                "summary": llm_metadata.get("summary", ""),
                "created_by": llm_metadata.get("created_by", "Unknown"),
                # New structured project intelligence fields
                "client_project": llm_metadata.get("client_project", "Unknown"),
                "brand": llm_metadata.get("brand", "N/A"),
                "pocs": resolved_poc,
                "business_objective": llm_metadata.get("business_objective", "Not extracted"),
                "approach": llm_metadata.get("approach", "Not extracted"),
                "datasets_used": llm_metadata.get("datasets_used", "Not extracted"),
                "key_outcome": llm_metadata.get("key_outcome", "Not extracted"),
                "case_study": llm_metadata.get("case_study", "None"),
                "timeline_pricing": llm_metadata.get("timeline_pricing", "Not mentioned"),
            }
            
            # Add to local manifest
            manifest_entries[file] = {
                "filename": file,
                "client": client_name,
                "topic": llm_metadata.get("topic", "General"),
                "file_type": parsed.get("type", "unknown"),
                "pocs": resolved_poc,
                "summary": llm_metadata.get("summary", ""),
            }

            # Flatten subtopics list for Pinecone metadata compatibility
            subtopics = llm_metadata.get("subtopics", [])
            if isinstance(subtopics, list):
                final_metadata["subtopics"] = ", ".join(subtopics)

            # 4. Chunk Text
            chunks = text_splitter.split_text(text)
            print(f"  -> {len(chunks)} chunks from {file}")

            for chunk in chunks:
                # INJECT METADATA INTO CONTENT FOR ENHANCED VECTOR EMBEDDING MATCHING
                enriched_chunk = (
                    f"Client: {client_name} | Brand: {llm_metadata.get('brand', 'N/A')}\n"
                    f"Document Source: {file}\n"
                    f"Topic: {llm_metadata.get('topic', 'General')}\n"
                    f"POC: {llm_metadata.get('pocs', 'Unknown')}\n"
                    f"Business Objective: {llm_metadata.get('business_objective', '')}\n"
                    f"Approach: {llm_metadata.get('approach', '')}\n"
                    f"Key Outcome: {llm_metadata.get('key_outcome', '')}\n"
                    f"---\n{chunk}"
                )
                doc = Document(page_content=enriched_chunk, metadata=final_metadata)
                documents_to_upsert.append(doc)

    if documents_to_upsert:
        # 5. Upsert to Pinecone in batches
        upsert_documents(documents_to_upsert, namespace=namespace)
        
        # 6. Save to local manifest
        manifest_path = os.path.join(os.getcwd(), "indexed_files.json")
        existing_manifest = {}
        if os.path.exists(manifest_path):
            try:
                with open(manifest_path, "r") as f:
                    existing_manifest = json.load(f)
            except: pass
            
        existing_manifest.update(manifest_entries)
        with open(manifest_path, "w") as f:
            json.dump(existing_manifest, f, indent=2)
            
        print("Ingestion complete and manifest updated.")
    else:
        print("No documents were processed.")


@router.post("/")
async def trigger_ingestion(request: IngestionRequest, background_tasks: BackgroundTasks):
    """Triggers the heavy ingestion job in a background thread so the API responds immediately."""
    background_tasks.add_task(process_ingestion, request.folder_path, request.namespace)
    return {
        "status": "success",
        "message": f"Ingestion started in background for folder: {request.folder_path} inside namespace: {request.namespace}",
    }


@router.get("/indexed-files")
def get_indexed_files():
    """Returns a list of indexed files from the local manifest."""
    try:
        import json
        manifest_path = os.path.join(os.getcwd(), "indexed_files.json")
        
        if not os.path.exists(manifest_path):
            return {"files": [], "total_vectors": 0, "total_files": 0}
            
        with open(manifest_path, "r") as f:
            manifest = json.load(f)
            
        file_list = sorted(manifest.values(), key=lambda x: x["client"])
        
        return {
            "files": file_list,
            "total_vectors": len(file_list) * 20, # rough estimate
            "total_files": len(file_list)
        }
    except Exception as e:
        print(f"Error fetching indexed files: {e}")
        return {"files": [], "total_vectors": 0, "total_files": 0, "error": str(e)}

