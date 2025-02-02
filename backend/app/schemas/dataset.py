from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class DatasetBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = False

class DatasetCreate(DatasetBase):
    pass

class DatasetUpdate(DatasetBase):
    pass

class Dataset(DatasetBase):
    id: int
    file_path: str
    vector_db_path: str
    created_at: datetime
    owner_id: int

    class Config:
        from_attributes = True

class DatasetQuery(BaseModel):
    query: str
    n_results: Optional[int] = 5

class QueryResult(BaseModel):
    document: str
    metadata: dict
    distance: float

class QueryResponse(BaseModel):
    results: List[QueryResult]
    dataset_id: int
    query: str
