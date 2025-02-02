# Vector Database Builder - AWS Amplify with FastAPI & ChromaDB Architecture

## Overview
This architecture maintains the existing FastAPI and ChromaDB implementation while utilizing AWS Amplify Gen 2 for hosting, authentication, and cloud resources.

## System Architecture

### Frontend (Next.js + Amplify)
- **Framework**: Next.js 13+
- **Hosting**: AWS Amplify Hosting
- **Authentication**: AWS Cognito
- **State Management**: React Query for API state
- **UI Components**: Tailwind CSS + Headless UI

### Backend Components

#### 1. FastAPI Service (ECS Fargate)
```typescript
// ecs/resource.ts
import { defineBackend } from '@aws-amplify/backend';

const backend = defineBackend({
  service: 'fastapi',
  container: {
    image: 'vectordb-fastapi',
    port: 8000,
    cpu: 1024,
    memory: 2048,
    environment: {
      CHROMA_DB_PATH: '/data/chromadb',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      AWS_S3_BUCKET: process.env.DOCUMENT_BUCKET
    },
    healthCheck: {
      path: '/health'
    }
  }
});
```

#### 2. Storage Resources

##### Document Storage (S3)
```typescript
// storage/resource.ts
import { defineStorage } from '@aws-amplify/backend';

const storage = defineStorage({
  name: 'documents',
  permissions: {
    authenticated: {
      actions: ['create', 'read', 'update', 'delete'],
      paths: ['public/**', 'private/${cognito-identity.amazonaws.com:sub}/*']
    }
  }
});
```

##### ChromaDB Persistence (EFS)
```typescript
// efs/resource.ts
import { defineEFS } from '@aws-amplify/backend';

const efs = defineEFS({
  name: 'chromadb-storage',
  performanceMode: 'generalPurpose',
  mountPoints: [{
    containerPath: '/data/chromadb',
    readOnly: false
  }]
});
```

#### 3. API Gateway Configuration
```typescript
// api/resource.ts
import { defineAPI } from '@aws-amplify/backend';

const api = defineAPI({
  name: 'vectordb-api',
  type: 'rest',
  routes: {
    '/api/v1/*': {
      target: 'fastapi-service',
      authorization: 'cognito'
    }
  }
});
```

### FastAPI Endpoints

```python
# main.py
from fastapi import FastAPI, UploadFile, Depends
from fastapi.security import OAuth2AuthorizationCodeBearer
from chromadb import Client, Settings

app = FastAPI()

@app.post("/api/v1/database/create")
async def create_database(
    name: str,
    files: List[UploadFile],
    model: str = "text-embedding-ada-002",
    chunk_size: int = 512,
    user_id: str = Depends(get_current_user)
):
    # Implementation remains similar but with AWS S3 integration
    pass

@app.get("/api/v1/database/{database_id}/status")
async def get_status(
    database_id: str,
    user_id: str = Depends(get_current_user)
):
    pass

@app.post("/api/v1/database/{database_id}/query")
async def query_database(
    database_id: str,
    query: str,
    n_results: int = 5,
    user_id: str = Depends(get_current_user)
):
    pass
```

### Authentication Flow
1. User authenticates through Cognito
2. Frontend receives JWT token
3. Token passed to FastAPI endpoints
4. FastAPI validates token with Cognito

### Data Flow

#### Document Processing:
1. Frontend uploads document to S3
2. S3 URL passed to FastAPI
3. FastAPI:
   - Downloads document from S3
   - Processes text
   - Creates ChromaDB collection
   - Stores embeddings
   - Updates status

#### Query Flow:
1. Frontend sends query with auth token
2. FastAPI:
   - Validates token
   - Generates query embedding
   - Searches ChromaDB
   - Returns results

## Infrastructure Components

### AWS Services Used
1. **AWS Amplify**:
   - Frontend hosting
   - Authentication (Cognito)
   - S3 storage
   - API Gateway

2. **ECS Fargate**:
   - Runs FastAPI container
   - Auto-scaling based on load
   - Health monitoring

3. **Amazon EFS**:
   - Persistent storage for ChromaDB
   - Mounted to ECS tasks
   - Automatic backups

4. **Amazon S3**:
   - Document storage
   - Versioning enabled
   - Lifecycle policies

### Networking
1. **VPC Configuration**:
   - Private subnets for ECS
   - Public subnets for ALB
   - VPC endpoints for AWS services

2. **Security Groups**:
   - ALB security group
   - ECS security group
   - EFS security group

## Development and Deployment

### Local Development
```bash
# Start local FastAPI server
uvicorn app.main:app --reload --port 8000

# Start Next.js development
npm run dev
```

### Deployment Configuration
```typescript
// pipeline/resource.ts
import { definePipeline } from '@aws-amplify/backend';

const pipeline = definePipeline({
  name: 'vectordb-pipeline',
  stages: ['dev', 'prod'],
  steps: [
    'build-frontend',
    'build-backend',
    'deploy-infrastructure',
    'deploy-services'
  ]
});
```

### Environment Variables
```bash
# Backend
OPENAI_API_KEY=sk-xxx
AWS_S3_BUCKET=xxx
AWS_REGION=xxx
COGNITO_USER_POOL_ID=xxx
COGNITO_CLIENT_ID=xxx

# Frontend
NEXT_PUBLIC_API_URL=xxx
NEXT_PUBLIC_AWS_REGION=xxx
```

## Monitoring and Logging

### CloudWatch Configuration
1. **Metrics**:
   - ECS CPU/Memory usage
   - API Gateway requests
   - ChromaDB operation latency

2. **Logs**:
   - FastAPI application logs
   - ECS container logs
   - API Gateway access logs

### Alarms
1. **Service Health**:
   - ECS task health
   - API latency
   - Error rates

2. **Resource Usage**:
   - EFS storage capacity
   - S3 storage metrics
   - ECS resource utilization

## Cost Optimization
1. **ECS Fargate**:
   - Right-sized containers
   - Auto-scaling policies
   - Spot instances for non-critical workloads

2. **Storage**:
   - S3 lifecycle policies
   - EFS infrequent access
   - CloudWatch log retention

## Security Considerations
1. **Authentication**:
   - Cognito user pools
   - JWT validation
   - API key management

2. **Data Protection**:
   - S3 encryption
   - EFS encryption
   - Network isolation

3. **Access Control**:
   - IAM roles
   - Security groups
   - VPC endpoints

## Migration Steps
1. Set up AWS Amplify project
2. Configure Cognito authentication
3. Create S3 buckets
4. Set up ECS cluster and EFS
5. Deploy FastAPI service
6. Update frontend configuration
7. Configure monitoring
8. Test and validate
9. Production deployment
