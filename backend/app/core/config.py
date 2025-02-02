from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Vector DB Builder"
    VERSION: str = "1.0.0"
    SECRET_KEY: str = "your-secret-key-here"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database Settings
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost/vectordb"
    
    # File Upload Settings
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 100 * 1024 * 1024  # 100MB
    
    # Vector DB Settings
    VECTOR_DB_DIR: str = "vector_dbs"
    INTERMEDIATE_DIR: str = "intermediate"  # Directory for intermediate processed files
    EMBEDDING_MODEL: str = "text-embedding-ada-002"  # Default OpenAI embedding model
    
    # OpenAI Settings
    OPENAI_API_KEY: str = ""  # This will be overridden by env var
    
    class Config:
        env_file = ".env"
        case_sensitive = True

def get_settings() -> Settings:
    settings = Settings()
    
    # Create necessary directories
    for dir_path in [settings.UPLOAD_DIR, settings.VECTOR_DB_DIR, settings.INTERMEDIATE_DIR]:
        Path(dir_path).mkdir(parents=True, exist_ok=True)
    
    return settings
