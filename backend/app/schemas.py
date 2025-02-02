from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    created_at: datetime

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class DatasetBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_public: bool = False

class DatasetCreate(DatasetBase):
    pass

class Dataset(DatasetBase):
    id: int
    file_path: str
    vector_db_path: str
    created_at: datetime
    owner_id: int

    class Config:
        orm_mode = True

class APIKeyBase(BaseModel):
    name: str

class APIKeyCreate(APIKeyBase):
    pass

class APIKey(APIKeyBase):
    id: int
    key: str
    created_at: datetime
    last_used: Optional[datetime]

    class Config:
        orm_mode = True

class UsageRecordBase(BaseModel):
    dataset_id: int
    query_count: int
    embedding_count: int
    storage_size: float

class UsageRecord(UsageRecordBase):
    id: int
    user_id: int
    timestamp: datetime

    class Config:
        orm_mode = True
