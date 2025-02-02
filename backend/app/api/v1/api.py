from fastapi import APIRouter
from .endpoints import database

api_router = APIRouter()

# Include database router
api_router.include_router(
    database.router,
    prefix="/database",
    tags=["database"]
)
