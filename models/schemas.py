from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ChatRequest(BaseModel):
    query: str
    session_id: Optional[str] = None

class DocumentReference(BaseModel):
    file_name: str
    url: Optional[str] = None
    summary: str
    metadata: Dict[str, Any]

class ChatResponse(BaseModel):
    answer: str
    references: List[DocumentReference]

class IngestionRequest(BaseModel):
    folder_path: str = "Data"
