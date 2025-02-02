# Vector Database Builder Architecture

## Overview
Vector Database Builder is a web application that allows users to create, manage, and query vector databases from their documents. The application consists of a FastAPI backend and a Next.js frontend.

## System Components

### Frontend Architecture

#### Pages
- `/` (Dashboard) - Overview of system usage and quick actions
- `/datasets` - List and manage vector databases
- `/usage` - View system usage statistics
- `/api-keys` - Manage API keys for external access

#### Components
1. **Navigation**
   - `Navbar` - Main navigation component
   - `Sidebar` - Side navigation with main sections

2. **Database Management**
   - `CreateDatabaseModal` - Modal for creating new databases
     - Supports file uploads
     - Model selection (text-embedding-ada-002, huggingface)
     - Chunk size configuration (256, 512, 1024 tokens)
   - Database listing with status indicators (processing, completed, error)
   - Database querying interface

3. **Common UI Components**
   - Button components
   - Form inputs
   - Status badges
   - Loading indicators

4. **Custom Hooks**
   - `useDatabases` - Hook for fetching and managing databases
     - Supports optional user filtering
     - Configurable polling for status updates
     - Error handling and loading states

### Backend Architecture

#### API Routes (`/api/v1/database/`)
1. **Database Creation**
   ```python
   POST /create
   Parameters:
   - name: str (required)
   - files: List[UploadFile] (required)
   - model: str (default: "text-embedding-ada-002")
   - chunk_size: int (default: 512)
   - user_id: str (optional)
   ```

2. **Database Status**
   ```python
   GET /{database_id}/status
   Returns: {"status": "processing" | "completed" | "error"}
   ```

3. **Database Listing**
   ```python
   GET /list
   Parameters:
   - user_id: str (optional) - Filter by user
   Returns: List of database objects
   ```

4. **Database Querying**
   ```python
   POST /{database_id}/query
   Parameters:
   - query: str (required)
   - n_results: int (default: 5)
   - model: str (default: "text-embedding-ada-002")
   ```

#### Services

1. **DatabaseService**
   - **File Management**
     - Handles file uploads and storage
     - Supports multiple file processing
     - Maintains file metadata

   - **Database Operations**
     - Creates unique database IDs using UUID
     - Manages database metadata in JSON format
     - Handles database status tracking
     - Supports database cleanup on failures

   - **Vector Operations**
     - Text chunking with configurable sizes
     - Embedding generation using specified models
     - Vector database creation using ChromaDB
     - Semantic search functionality

2. **FileService**
   - File saving and reading
   - Text extraction from files
   - Intermediate file management

3. **EmbeddingService**
   - Text chunking logic
   - Embedding generation
   - Model management

#### Data Storage

1. **Vector Databases**
   - Stored in `./vector_dbs/` directory
   - Each database has a unique UUID
   - Structure:
     ```
     vector_dbs/
     ├── {database_id}/
     │   ├── metadata.json  # Database metadata
     │   ├── data_level0.bin  # ChromaDB data
     │   ├── header.bin
     │   ├── length.bin
     │   └── link_lists.bin
     ```

2. **Metadata Storage**
   - Each database has a metadata.json file containing:
     ```json
     {
       "name": "database_name",
       "user_id": "user_id",
       "document_count": 0,
       "status": "processing|completed|error"
     }
     ```

## Implementation Details

### Frontend Implementation

1. **Database Creation**
   ```typescript
   // CreateDatabaseModal.tsx
   const handleSubmit = async (e: React.FormEvent) => {
     const formData = new FormData();
     formData.append('name', name);
     formData.append('model', selectedModel.id);
     formData.append('chunk_size', chunkSize.id);
     formData.append('user_id', 'user123');
     files.forEach((file) => formData.append('files', file));
     
     const response = await fetch('http://localhost:8000/api/v1/database/create', {
       method: 'POST',
       body: formData,
     });
   };
   ```

2. **Database Listing**
   ```typescript
   // useDatabases.ts
   export function useDatabases(userId?: string, pausePolling: boolean = true) {
     const fetchDatabases = async () => {
       const url = userId 
         ? `http://localhost:8000/api/v1/database/list?user_id=${userId}`
         : 'http://localhost:8000/api/v1/database/list';
       const response = await fetch(url);
       const data = await response.json();
       setDatabases(data.databases);
     };
   }
   ```

### Backend Implementation

1. **Database Creation**
   ```python
   # database_service.py
   async def create_database(self, name: str, files: List[UploadFile], 
                           model: str = "text-embedding-ada-002",
                           chunk_size: int = 512,
                           user_id: Optional[str] = None) -> str:
       database_id = str(uuid.uuid4())
       db_path = self.vector_db_path / database_id
       
       metadata = {
           "name": name,
           "user_id": user_id,
           "document_count": len(files),
           "status": "processing"
       }
       
       # Process files and create vector database
       collection = self.chroma_client.create_collection(name=database_id)
       collection.add(
           embeddings=embeddings,
           documents=texts,
           metadatas=metadatas,
           ids=[str(i) for i in range(len(texts))]
       )
   ```

2. **Database Listing**
   ```python
   # database_service.py
   def list_databases(self, user_id: str = None) -> List[dict]:
       databases = []
       for db_dir in self.vector_db_path.iterdir():
           if not db_dir.is_dir() or db_dir.name.startswith('.'):
               continue
               
           try:
               collection = self.chroma_client.get_collection(name=db_dir.name)
               count = collection.count()
           except Exception:
               count = 0
           
           metadata_path = db_dir / "metadata.json"
           if metadata_path.exists():
               with open(metadata_path, "r") as f:
                   metadata = json.load(f)
                   
           if not user_id or metadata.get("user_id") == user_id:
               databases.append({
                   "id": db_dir.name,
                   "name": metadata.get("name", db_dir.name),
                   "document_count": metadata.get("document_count", count),
                   "status": metadata.get("status", "completed"),
                   "user_id": metadata.get("user_id")
               })
   ```

## Security Considerations
- CORS configuration to allow only specific origins
- Input validation using Pydantic models
- File upload restrictions and validation
- Optional user_id tracking for database ownership
- Error handling and cleanup on failures

## Future Enhancements
1. User authentication and authorization
2. Support for more document types
3. Advanced querying capabilities
4. Database sharing and collaboration features
5. Usage analytics and monitoring
6. Custom embedding model support
7. Batch processing for large files
8. Real-time processing status updates

## Technology Stack

### Frontend
- Next.js 13+ (React framework)
- TypeScript
- Tailwind CSS for styling
- Headless UI for components

### Backend
- FastAPI (Python web framework)
- Pydantic for data validation
- CORS middleware for frontend communication
- Async processing for database creation

## File Structure

```
vectorDBBuilder/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx (Dashboard)
│   │   │   ├── datasets/
│   │   │   │   └── page.tsx (Database Management)
│   │   │   ├── usage/
│   │   │   │   └── page.tsx (Usage Stats)
│   │   │   └── api-keys/
│   │   │       └── page.tsx (API Key Management)
│   │   ├── components/
│   │   │   ├── navigation/
│   │   │   │   ├── Navbar.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   └── database/
│   │   │       └── CreateDatabaseModal.tsx
│   │   └── styles/
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   │   └── database.py
│   │   ├── models/
│   │   │   └── database.py
│   │   └── services/
│   │       └── database_service.py
│   └── requirements.txt
├── ARCHITECTURE.md
└── README.md
