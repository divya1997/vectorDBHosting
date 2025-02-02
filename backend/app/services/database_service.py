from typing import List, Dict, Any, Optional
import uuid
import json
from pathlib import Path
import logging
import chromadb
from datetime import datetime, timezone
from fastapi import UploadFile
from .file_service import FileService
from .embedding_service import EmbeddingService
from ..core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

class DatabaseService:
    def __init__(self):
        self.file_service = FileService()
        self.embedding_service = EmbeddingService()
        self.chroma_client = chromadb.PersistentClient(path=settings.VECTOR_DB_DIR)
        self.intermediate_dir = Path(settings.INTERMEDIATE_DIR)
        self.intermediate_dir.mkdir(parents=True, exist_ok=True)
        self.vector_db_path = Path("./vector_dbs")
        self.vector_db_path.mkdir(exist_ok=True)

    async def create_database(
        self,
        name: str,
        files: List[UploadFile],
        description: str,
        sector: str,
        model: str = "text-embedding-ada-002",
        chunk_size: int = 512,
        user_id: Optional[str] = None
    ) -> str:
        """Create a new vector database from uploaded files"""
        try:
            # Generate unique database ID
            database_id = str(uuid.uuid4())
            
            # Create database directory
            db_path = self.vector_db_path / database_id
            db_path.mkdir(exist_ok=True)
            
            # Calculate total size of files
            total_file_size = 0
            for file in files:
                content = await file.read()
                total_file_size += len(content)
                await file.seek(0)  # Reset file position after reading
            
            # Create and save metadata
            current_time = datetime.now(timezone.utc).isoformat()
            metadata = {
                "name": name,
                "description": description,
                "sector": sector,
                "file_count": len(files),
                "total_file_size": total_file_size,  # Initial size of uploaded files
                "created_by": user_id,
                "created_at": current_time,
                "updated_at": current_time,
                "status": "processing",
                "document_count": 0,  # Will be updated after processing
                "database_size": 0,  # Will be updated after processing
            }
            
            with open(db_path / "metadata.json", "w") as f:
                json.dump(metadata, f)
            
            # Process and save each file
            all_chunks = []
            for file in files:
                # Save file
                file_path = await self.file_service.save_file(
                    file=file,
                    filename=file.filename,
                    database_id=database_id
                )
                
                # Extract text
                text = self.file_service.read_file(file_path)
                
                # Chunk text
                chunks = self.embedding_service.chunk_text(
                    text=text,
                    chunk_size=chunk_size
                )
                
                # Add metadata to chunks
                chunks_with_metadata = [{
                    'text': chunk,
                    'metadata': {
                        'source': file.filename,
                        'database_id': database_id
                    }
                } for chunk in chunks]
                
                all_chunks.extend(chunks_with_metadata)
            
            # Save intermediate chunks for inspection
            self._save_intermediate_chunks(database_id, all_chunks)
            
            # Create Chroma collection
            collection = self.chroma_client.create_collection(name=database_id)
            
            # Add documents to collection
            texts = [chunk['text'] for chunk in all_chunks]
            metadatas = [chunk['metadata'] for chunk in all_chunks]
            logger.info(f"Getting embeddings with model: {model}")
            embeddings = self.embedding_service.get_embeddings(texts, model)
            
            collection.add(
                embeddings=embeddings,
                documents=texts,
                metadatas=metadatas,
                ids=[str(i) for i in range(len(texts))]
            )
            
            # Update metadata with final document count
            self.update_database_metadata(database_id, {
                "document_count": len(texts),
                "status": "completed"
            })
            
            # Update database size
            self._update_database_size(database_id)
            
            return database_id
        
        except Exception as e:
            # Cleanup on failure
            logger.error(f"Error creating database: {str(e)}")
            self.cleanup_database(database_id)
            raise e

    def _save_intermediate_chunks(self, database_id: str, chunks: List[Dict[str, Any]]):
        """Save intermediate chunks to file for inspection"""
        intermediate_file = self.intermediate_dir / f"{database_id}_chunks.json"
        with open(intermediate_file, 'w') as f:
            json.dump(chunks, f, indent=2)

    def get_database_status(self, database_id: str) -> str:
        """Get the current status of database processing"""
        try:
            collection = self.chroma_client.get_collection(name=database_id)
            return "completed" if collection else "error"
        except Exception:
            return "error"

    def cleanup_database(self, database_id: str):
        """Clean up database and associated files"""
        try:
            # Delete Chroma collection
            try:
                self.chroma_client.delete_collection(name=database_id)
            except ValueError:
                pass  # Collection might not exist
            
            # Delete uploaded files
            self.file_service.cleanup_files(database_id)
            
            # Delete intermediate chunks
            intermediate_file = self.intermediate_dir / f"{database_id}_chunks.json"
            if intermediate_file.exists():
                intermediate_file.unlink()
                
            # Delete database directory
            db_path = self.vector_db_path / database_id
            if db_path.exists():
                db_path.rmdir()
                
        except Exception as e:
            logger.error(f"Error cleaning up database {database_id}: {str(e)}")
            raise e

    async def query_database(
        self,
        database_id: str,
        query: str,
        n_results: int = 5,
        model: str = "text-embedding-ada-002"
    ) -> List[Dict[str, Any]]:
        """Query a database with semantic search"""
        try:
            # Get collection
            collection = self.chroma_client.get_collection(name=database_id)
            if not collection:
                raise ValueError(f"Database {database_id} not found")
            
            # Get query embedding
            query_embedding = self.embedding_service.get_embeddings([query], model)[0]
            
            # Query collection
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                include=['documents', 'metadatas', 'distances']
            )
            
            # Format results
            formatted_results = []
            for i in range(len(results['documents'][0])):
                formatted_results.append({
                    'text': results['documents'][0][i],
                    'metadata': results['metadatas'][0][i],
                    'distance': results['distances'][0][i]
                })
            
            return formatted_results
        
        except Exception as e:
            logger.error(f"Error querying database {database_id}: {str(e)}")
            raise e

    def list_databases(self, user_id: str = None) -> List[dict]:
        """
        List all databases in the vector_dbs directory.
        If user_id is provided, filter by user_id in metadata.json
        """
        databases = []
        
        # Scan through all directories in vector_dbs
        for db_dir in self.vector_db_path.iterdir():
            if not db_dir.is_dir() or db_dir.name.startswith('.'):
                continue
                
            # Read metadata.json if it exists
            metadata_path = db_dir / "metadata.json"
            if not metadata_path.exists():
                continue

            try:
                with open(metadata_path, "r") as f:
                    metadata = json.load(f)
            except Exception as e:
                logger.error(f"Error reading metadata for {db_dir.name}: {e}")
                continue

            # Try to get collection info from ChromaDB if status is completed
            document_count = metadata.get("document_count", 0)
            if metadata.get("status") == "completed":
                try:
                    collection = self.chroma_client.get_collection(name=db_dir.name)
                    if collection:
                        document_count = collection.count()
                        # Update metadata if count differs
                        if document_count != metadata.get("document_count"):
                            self.update_database_metadata(db_dir.name, {
                                "document_count": document_count
                            })
                except Exception as e:
                    # If collection doesn't exist but metadata says completed,
                    # mark it as error
                    if metadata.get("status") == "completed":
                        self.update_database_metadata(db_dir.name, {
                            "status": "error",
                            "error_message": "Vector database files not found"
                        })
                        metadata["status"] = "error"
            
            # Include database only if:
            # 1. No user_id filter is provided (dashboard view)
            # 2. Or if user_id matches the filter (your databases view)
            if not user_id or metadata.get("created_by") == user_id:
                databases.append({
                    "id": db_dir.name,
                    "name": metadata.get("name", db_dir.name),
                    "description": metadata.get("description", ""),
                    "sector": metadata.get("sector", ""),
                    "file_count": metadata.get("file_count", 0),
                    "document_count": document_count,
                    "total_file_size": metadata.get("total_file_size", 0),
                    "database_size": metadata.get("database_size", 0),
                    "status": metadata.get("status", "unknown"),
                    "created_by": metadata.get("created_by"),
                    "created_at": metadata.get("created_at"),
                    "updated_at": metadata.get("updated_at"),
                    "error_message": metadata.get("error_message")
                })
                    
        return databases

    def get_database(self, database_id: str) -> Optional[dict]:
        """Get database details by ID"""
        db_path = self.vector_db_path / database_id
        metadata_path = db_path / "metadata.json"
        
        if not metadata_path.exists():
            return None
            
        with open(metadata_path, "r") as f:
            metadata = json.load(f)
            
        return {
            "id": database_id,
            "name": metadata.get("name"),
            "document_count": metadata.get("document_count", 0),
            "status": metadata.get("status", "unknown"),
            "created_by": metadata.get("created_by")
        }

    def get_database_info(self, database_id: str) -> Optional[Dict[str, Any]]:
        """Get database information from metadata file"""
        try:
            db_path = self.vector_db_path / database_id
            metadata_path = db_path / "metadata.json"
            
            if not metadata_path.exists():
                return None
                
            with open(metadata_path) as f:
                metadata = json.load(f)
            
            return metadata
            
        except Exception as e:
            logger.error(f"Error getting database info: {str(e)}")
            return None

    def update_database_status(self, database_id: str, status: str) -> bool:
        """Update database status"""
        db_path = self.vector_db_path / database_id
        metadata_path = db_path / "metadata.json"
        
        if not metadata_path.exists():
            return False
            
        with open(metadata_path, "r") as f:
            metadata = json.load(f)
            
        metadata["status"] = status
        
        with open(metadata_path, "w") as f:
            json.dump(metadata, f)
            
        return True

    def update_database_metadata(self, database_id: str, updates: Dict[str, Any]) -> bool:
        """Update database metadata"""
        db_path = self.vector_db_path / database_id
        metadata_path = db_path / "metadata.json"
        
        if not metadata_path.exists():
            return False
            
        try:
            # Read existing metadata
            with open(metadata_path, "r") as f:
                metadata = json.load(f)
            
            # Update metadata
            metadata.update(updates)
            metadata["updated_at"] = datetime.now(timezone.utc).isoformat()
            
            # Write updated metadata
            with open(metadata_path, "w") as f:
                json.dump(metadata, f)
                
            return True
        except Exception as e:
            logger.error(f"Error updating metadata for {database_id}: {str(e)}")
            return False

    def _update_database_size(self, database_id: str):
        """Update database size in metadata after processing is complete"""
        try:
            # Calculate size of ChromaDB files
            chroma_path = Path(settings.VECTOR_DB_DIR) / database_id
            chroma_size = sum(f.stat().st_size for f in chroma_path.rglob('*') if f.is_file())
            
            # Update metadata with final size
            self.update_database_metadata(database_id, {
                "database_size": chroma_size,
                "status": "completed"
            })
        except Exception as e:
            logger.error(f"Error updating database size for {database_id}: {str(e)}")

    def validate_api_key(self, database_id: str, api_key: str) -> Optional[str]:
        """Validate API key and return user_id if valid"""
        try:
            keys_file = Path("vector_dbs/api_keys.json")
            
            if not keys_file.exists():
                return None
            
            with open(keys_file) as f:
                keys_data = json.load(f)
            
            # Check if database exists and has keys
            if database_id not in keys_data:
                return None
            
            # Find user with matching key
            for user_id, key_info in keys_data[database_id].items():
                if key_info["key"] == api_key:
                    return user_id
            
            return None
            
        except Exception as e:
            logger.error(f"Error validating API key: {str(e)}")
            return None

    def get_database_id_from_key(self, api_key: str) -> Optional[str]:
        """Get database ID associated with an API key"""
        try:
            keys_file = Path("vector_dbs/api_keys.json")
            
            if not keys_file.exists():
                return None
            
            with open(keys_file) as f:
                keys_data = json.load(f)
            
            # Search for the key in all databases
            for database_id, users in keys_data.items():
                for user_info in users.values():
                    if user_info["key"] == api_key:
                        return database_id
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting database ID from key: {str(e)}")
            return None
