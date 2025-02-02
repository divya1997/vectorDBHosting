from pydantic import BaseModel
from typing import Optional

class User(BaseModel):
    id: str
    email: str
    is_active: bool = True
    is_superuser: bool = False
    full_name: Optional[str] = None
