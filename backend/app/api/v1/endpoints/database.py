from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from typing import List, Optional
import logging
import json
import os
import secrets
from pathlib import Path
from datetime import datetime
from ....services.database_service import DatabaseService
from ....services.usage_service import UsageService
from ....core.config import get_settings

router = APIRouter()
settings = get_settings()
logger = logging.getLogger(__name__)

@router.post("/create")
async def create_database(
    name: str = Form(...),
    files: List[UploadFile] = File(...),
    description: str = Form(...),
    sector: str = Form(...),
    model: str = Form("text-embedding-ada-002"),
    chunk_size: int = Form(512),
    user_id: str = Form(None)  # Make it optional for now
):
    """Create a new vector database from uploaded files"""
    try:
        logger.info(f"Creating database with name: {name}, sector: {sector}")
        database_service = DatabaseService()
        database_id = await database_service.create_database(
            name=name,
            files=files,
            description=description,
            sector=sector,
            model=model,
            chunk_size=chunk_size,
            user_id=user_id
        )
        return {"database_id": database_id, "status": "processing"}
    
    except Exception as e:
        logger.error(f"Error creating database: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{database_id}/status")
async def get_database_status(database_id: str):
    """Get the current status of database processing"""
    try:
        database_service = DatabaseService()
        status = database_service.get_database_status(database_id)
        return {"status": status}
    
    except Exception as e:
        logger.error(f"Error getting database status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def list_databases(user_id: str = None):
    """List all databases or filter by user_id"""
    try:
        database_service = DatabaseService()
        databases = database_service.list_databases(user_id)
        return databases
    except Exception as e:
        logger.error(f"Error listing databases: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{database_id}")
async def delete_database(database_id: str):
    """Delete a database and its files"""
    try:
        database_service = DatabaseService()
        await database_service.delete_database(database_id)
        return {"status": "success"}
    
    except Exception as e:
        logger.error(f"Error deleting database: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/external/query")
async def external_query(
    query: str = Form(...),
    api_key: str = Form(...),
    n_results: int = Form(5),
    model: str = Form("text-embedding-ada-002")
):
    """Query a database using an API key (for external users)"""
    try:
        # Initialize services
        database_service = DatabaseService()
        usage_service = UsageService()
        
        # Get database ID from API key
        database_id = database_service.get_database_id_from_key(api_key)
        if not database_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid API key"
            )
        
        # Validate API key and get user_id
        user_id = database_service.validate_api_key(database_id, api_key)
        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid API key"
            )
        
        # Track the query
        usage_service.track_query(user_id, api_key, database_id)
        
        # Get database info to check status
        db_info = database_service.get_database_info(database_id)
        if not db_info:
            raise HTTPException(
                status_code=404,
                detail="Database not found"
            )
        
        if db_info["status"] != "completed":
            raise HTTPException(
                status_code=400,
                detail="Database is not ready for querying"
            )
        
        # Query the database
        results = await database_service.query_database(
            database_id=database_id,
            query=query,
            n_results=n_results,
            model=model
        )
        
        # Format response
        response_data = {
            "query": query,
            "database_name": db_info["name"],
            "results": [
                {
                    "text": result.get("text", ""),
                    "source": result.get("metadata", {}).get("source", "unknown"),
                    "score": result.get("distance", 0)
                }
                for result in results
            ]
        }
        
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error querying database: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{database_id}/query")
async def query_database(
    database_id: str,
    query: str = Form(...),
    n_results: int = Form(5),
    model: str = Form("text-embedding-ada-002")
):
    """Query a database with semantic search"""
    try:
        logger.info(f"Querying database with model: {model}")  # Log received model
        database_service = DatabaseService()
        results = await database_service.query_database(
            database_id=database_id,
            query=query,
            n_results=n_results,
            model=model
        )
        return {"results": results}
    
    except Exception as e:
        logger.error(f"Error querying database: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{database_id}/generate-key")
async def generate_api_key(database_id: str, user_id: str):
    """Generate a new API key for a database"""
    try:
        print("Generating API key")
        # Generate a secure random key
        api_key = secrets.token_urlsafe(32)
        
        # Path to the api keys file
        keys_file = Path("vector_dbs/api_keys.json")
        
        # Create file if it doesn't exist
        if not keys_file.exists():
            keys_file.write_text("{}")
            print("File created to store API keys")
        
        # Read existing keys
        with open(keys_file) as f:
            keys_data = json.load(f)
        
        # Initialize structure if needed
        if database_id not in keys_data:
            keys_data[database_id] = {}
        
        # Store the new key
        keys_data[database_id][user_id] = {
            "key": api_key,
            "created_at": datetime.now().isoformat()
        }
        
        # Write back to file
        with open(keys_file, "w") as f:
            json.dump(keys_data, f, indent=2)
        
        return {"api_key": api_key}
        
    except Exception as e:
        logger.error(f"Error generating API key: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{database_id}/api-key")
async def get_api_key(database_id: str, user_id: str):
    """Get the API key for a database if it exists"""
    try:
        print("Getting API key")
        # Path to the api keys file
        keys_file = Path("vector_dbs/api_keys.json")
        
        # If file doesn't exist or is empty, return None
        if not keys_file.exists():
            return {"api_key": None}
        
        # Read existing keys
        with open(keys_file) as f:
            keys_data = json.load(f)
        
        # Get the key if it exists
        api_key = keys_data.get(database_id, {}).get(user_id, {}).get("key")
        
        return {"api_key": api_key}
        
    except Exception as e:
        logger.error(f"Error getting API key: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user/{user_id}/api-keys")
async def get_user_api_keys(user_id: str):
    """Get all API keys for a user"""
    try:
        print(f"Getting all API keys for user {user_id}")
        # Path to the api keys file
        keys_file = Path("vector_dbs/api_keys.json")
        
        # If file doesn't exist or is empty, return empty list
        if not keys_file.exists():
            return {"keys": []}
        
        # Read existing keys
        with open(keys_file) as f:
            keys_data = json.load(f)
        
        # Collect all keys for this user
        user_keys = []
        for db_id, db_keys in keys_data.items():
            if user_id in db_keys:
                # Get database name
                database_service = DatabaseService()
                db_info = database_service.get_database_info(db_id)
                db_name = db_info.get('name', 'Unknown Database') if db_info else 'Unknown Database'
                
                user_keys.append({
                    "database_id": db_id,
                    "database_name": db_name,
                    "key": db_keys[user_id]["key"],
                    "created_at": db_keys[user_id]["created_at"]
                })
        
        return {"keys": user_keys}
        
    except Exception as e:
        logger.error(f"Error getting user API keys: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/usage/{user_id}")
async def get_usage(user_id: str):
    """Get usage statistics for a user"""
    try:
        usage_service = UsageService()
        usage_data = usage_service.get_user_usage(user_id)
        
        if not usage_data:
            raise HTTPException(
                status_code=404,
                detail="Usage data not found"
            )
        
        return usage_data
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting usage data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
