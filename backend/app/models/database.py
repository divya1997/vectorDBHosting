from pydantic import BaseModel
from typing import List, Optional

class DatabaseCreate(BaseModel):
    name: str
    description: Optional[str] = None
    model: str
    chunk_size: int
    files: List[str]

class DatabaseResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    status: str
    file_count: int

class DatabaseStatus(BaseModel):
    id: str
    status: str  # 'processing', 'completed', or 'error'
