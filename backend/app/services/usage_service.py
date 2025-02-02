import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

class UsageService:
    def __init__(self):
        self.usage_file = Path("vector_dbs/usage.json")
        self._ensure_usage_file()
    
    def _ensure_usage_file(self):
        """Ensure usage file exists with proper structure"""
        if not self.usage_file.exists():
            self.usage_file.parent.mkdir(parents=True, exist_ok=True)
            self._save_usage({
                "users": {},  # user_id -> usage data
                "api_keys": {}  # api_key -> usage data
            })
    
    def _load_usage(self) -> dict:
        """Load usage data from file"""
        try:
            logger.info(f"Loading usage data from {self.usage_file}")
            if not self.usage_file.exists():
                logger.info("Usage file does not exist, returning empty data")
                return {"users": {}, "api_keys": {}}
                
            with open(self.usage_file) as f:
                data = json.load(f)
                logger.info(f"Loaded usage data: {json.dumps(data, indent=2)}")
                return data
        except Exception as e:
            logger.error(f"Error loading usage data: {str(e)}")
            return {"users": {}, "api_keys": {}}
    
    def _save_usage(self, usage_data: dict):
        """Save usage data to file"""
        try:
            with open(self.usage_file, 'w') as f:
                json.dump(usage_data, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving usage data: {str(e)}")
    
    def track_query(self, user_id: str, api_key: str, database_id: str):
        """Track a query for both user and API key"""
        try:
            usage_data = self._load_usage()
            timestamp = datetime.now().isoformat()
            
            # Update user usage
            if user_id not in usage_data["users"]:
                usage_data["users"][user_id] = {
                    "total_queries": 0,
                    "databases": {},
                    "history": []
                }
            
            user_data = usage_data["users"][user_id]
            user_data["total_queries"] += 1
            
            if database_id not in user_data["databases"]:
                user_data["databases"][database_id] = 0
            user_data["databases"][database_id] += 1
            
            user_data["history"].append({
                "timestamp": timestamp,
                "database_id": database_id,
                "api_key": api_key
            })
            
            # Update API key usage
            if api_key not in usage_data["api_keys"]:
                usage_data["api_keys"][api_key] = {
                    "total_queries": 0,
                    "database_id": database_id,
                    "history": []
                }
            
            key_data = usage_data["api_keys"][api_key]
            key_data["total_queries"] += 1
            key_data["history"].append({
                "timestamp": timestamp,
                "user_id": user_id
            })
            
            self._save_usage(usage_data)
            
        except Exception as e:
            logger.error(f"Error tracking query: {str(e)}")
    
    def get_user_usage(self, user_id: str) -> Optional[Dict]:
        """Get usage statistics for a user"""
        try:
            logger.info(f"Getting usage data for user: {user_id}")
            usage_data = self._load_usage()
            # If user doesn't exist yet, return empty usage data
            if user_id not in usage_data["users"]:
                logger.info(f"No usage data found for user {user_id}, returning empty data")
                return {
                    "total_queries": 0,
                    "databases": {},
                    "history": []
                }
            user_data = usage_data["users"].get(user_id)
            logger.info(f"Found usage data for user {user_id}: {json.dumps(user_data, indent=2)}")
            return user_data
        except Exception as e:
            logger.error(f"Error getting user usage: {str(e)}")
            return None
    
    def get_api_key_usage(self, api_key: str) -> Optional[Dict]:
        """Get usage statistics for an API key"""
        try:
            usage_data = self._load_usage()
            return usage_data["api_keys"].get(api_key)
        except Exception as e:
            logger.error(f"Error getting API key usage: {str(e)}")
            return None
    
    def get_all_usage(self) -> Dict:
        """Get all usage statistics"""
        try:
            return self._load_usage()
        except Exception as e:
            logger.error(f"Error getting all usage: {str(e)}")
            return {"users": {}, "api_keys": {}}
