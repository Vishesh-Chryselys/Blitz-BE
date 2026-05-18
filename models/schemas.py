from pydantic import BaseModel, Field
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
    actions: List["ChatAction"] = Field(default_factory=list)

class ChatAction(BaseModel):
    type: str
    topic: Optional[str] = None
    label: Optional[str] = None
    payload: Dict[str, Any] = Field(default_factory=dict)

class PPTRequest(BaseModel):
    topic: str
    content: str
    user_query: Optional[str] = None
    references: List[DocumentReference] = Field(default_factory=list)

class IngestionRequest(BaseModel):
    folder_path: str = "Data"
    namespace: Optional[str] = "default"
