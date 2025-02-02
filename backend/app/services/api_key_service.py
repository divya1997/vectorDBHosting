import secrets
import uuid
from datetime import datetime
from typing import Optional, Dict, List
import json
from pathlib import Path
import logging
from ..core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class APIKeyService:
    def __init__(self):
        self.api_keys_file = Path(settings.VECTOR_DB_DIR) / "api_keys.json"
        self._ensure_api_keys_file()
    
    def _ensure_api_keys_file(self):
        """Ensure the API keys file exists"""
        if not self.api_keys_file.exists():
            self.api_keys_file.write_text("{}")
    
    def _load_api_keys(self) -> Dict:
        """Load API keys from file"""
        return json.loads(self.api_keys_file.read_text())
    
    def _save_api_keys(self, api_keys: Dict):
        """Save API keys to file"""
        self.api_keys_file.write_text(json.dumps(api_keys, indent=2))
    
    def generate_api_key(self, database_id: str, user_id: str = None) -> str:
        """Generate a new API key for a database"""
        # Generate a unique API key
        api_key = f"vdb-{secrets.token_urlsafe(32)}"
        
        # Load existing API keys
        api_keys = self._load_api_keys()
        
        # Add new API key
        if database_id not in api_keys:
            api_keys[database_id] = []
        
        api_keys[database_id].append({
            "key": api_key,
            "created_at": str(uuid.uuid4()),  # Using UUID as timestamp for now
            "user_id": user_id,
            "is_active": True
        })
        
        # Save updated API keys
        self._save_api_keys(api_keys)
        
        return api_key
    
    def validate_api_key(self, api_key: str, database_id: str) -> bool:
        """Validate an API key for a database"""
        api_keys = self._load_api_keys()
        
        if database_id not in api_keys:
            return False
        
        # Check if API key exists and is active
        return any(
            key["key"] == api_key and key["is_active"]
            for key in api_keys[database_id]
        )
    
    def get_database_api_keys(self, database_id: str, user_id: str = None) -> List[Dict]:
        """Get all API keys for a database, optionally filtered by user_id"""
        api_keys = self._load_api_keys()
        keys = api_keys.get(database_id, [])
        
        if user_id:
            keys = [key for key in keys if key.get("user_id") == user_id]
            
        return keys
    
    def get_all_api_keys(self, user_id: str = None) -> Dict[str, List[Dict]]:
        """Get all API keys, optionally filtered by user_id"""
        api_keys = self._load_api_keys()
        
        if user_id:
            filtered_keys = {}
            for db_id, keys in api_keys.items():
                user_keys = [key for key in keys if key.get("user_id") == user_id]
                if user_keys:
                    filtered_keys[db_id] = user_keys
            return filtered_keys
            
        return api_keys
