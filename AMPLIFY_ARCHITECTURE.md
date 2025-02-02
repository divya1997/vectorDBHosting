# Vector Database Builder - AWS Amplify Gen 2 Architecture

## Overview
This document outlines the architecture for migrating the Vector Database Builder to AWS Amplify Gen 2, utilizing various AWS services for a scalable, serverless architecture.

## Frontend Architecture
- **Framework**: Next.js 13+ (remains unchanged)
- **Hosting**: AWS Amplify Hosting
- **Authentication**: AWS Cognito
- **Storage**: AWS S3 for document uploads
- **API**: GraphQL API using AWS AppSync

## Backend Resources

### Authentication (AWS Cognito)
```typescript
// auth/resource.ts
import { defineAuth } from '@aws-amplify/backend';

const auth = defineAuth({
  loginWith: {
    email: true,
    phone: false,
    username: false,
    passwordSettings: {
      minLength: 8,
      requireNumbers: true,
      requireSpecialCharacters: true,
    }
  },
  multiFactor: {
    mode: 'OPTIONAL'
  }
});
```

### Data Storage

1. **Amazon DynamoDB Tables**
```typescript
// data/resource.ts
import { defineData } from '@aws-amplify/backend';

const data = defineData({
  schema: {
    // Database Metadata Table
    VectorDatabase: {
      primaryKey: ['id', 'string'],
      sortKey: ['userId', 'string'],
      fields: {
        name: 'string',
        status: 'string',
        model: 'string',
        chunkSize: 'number',
        createdAt: 'string',
        updatedAt: 'string',
        documentCount: 'number'
      }
    },
    // Document Metadata Table
    Document: {
      primaryKey: ['id', 'string'],
      sortKey: ['databaseId', 'string'],
      fields: {
        fileName: 'string',
        fileType: 'string',
        s3Key: 'string',
        status: 'string',
        chunkCount: 'number',
        createdAt: 'string'
      }
    },
    // API Keys Table
    ApiKey: {
      primaryKey: ['id', 'string'],
      sortKey: ['userId', 'string'],
      fields: {
        databaseId: 'string',
        name: 'string',
        key: 'string',
        createdAt: 'string',
        lastUsed: 'string'
      }
    }
  }
});
```

2. **Amazon OpenSearch Service**
- Used for storing and querying vector embeddings
- Configured with k-NN plugin for vector search
- Separate index per vector database

### Storage (S3)
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

### Functions

1. **Document Processing Function**
```typescript
// functions/processDocument.ts
import { defineFunction } from '@aws-amplify/backend';

const processDocument = defineFunction({
  name: 'processDocument',
  entry: 'src/functions/processDocument.ts',
  timeout: 900, // 15 minutes
  memory: 2048,
  environment: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENSEARCH_DOMAIN: process.env.OPENSEARCH_DOMAIN
  }
});
```

2. **Vector Search Function**
```typescript
// functions/vectorSearch.ts
const vectorSearch = defineFunction({
  name: 'vectorSearch',
  entry: 'src/functions/vectorSearch.ts',
  timeout: 30,
  memory: 1024
});
```

### GraphQL API (AppSync)
```typescript
// api/schema.graphql
type VectorDatabase @model {
  id: ID!
  userId: String!
  name: String!
  status: String!
  model: String!
  chunkSize: Int!
  createdAt: String!
  updatedAt: String!
  documentCount: Int!
  documents: [Document] @hasMany
}

type Document @model {
  id: ID!
  databaseId: String!
  fileName: String!
  fileType: String!
  s3Key: String!
  status: String!
  chunkCount: Int!
  createdAt: String!
}

type Query {
  searchDatabase(databaseId: ID!, query: String!, nResults: Int): [SearchResult]
  getDatabaseStatus(databaseId: ID!): DatabaseStatus
}

type Mutation {
  createDatabase(input: CreateDatabaseInput!): VectorDatabase
  processDocument(input: ProcessDocumentInput!): Document
}
```

## Processing Pipeline

1. **Document Upload Flow**:
   - Frontend uploads document to S3
   - S3 event triggers document processing Lambda
   - Lambda processes document:
     - Extracts text
     - Chunks text
     - Generates embeddings
     - Stores in OpenSearch
   - Updates DynamoDB with status

2. **Query Flow**:
   - Client sends query through GraphQL API
   - AppSync resolves to vector search Lambda
   - Lambda:
     - Generates query embedding
     - Searches OpenSearch
     - Returns results

## Security Considerations

1. **Authentication & Authorization**:
   - Cognito user pools for authentication
   - Fine-grained access control with AppSync
   - API keys for external access

2. **Data Protection**:
   - S3 bucket encryption
   - OpenSearch encryption at rest
   - Secure environment variables for API keys

3. **Network Security**:
   - VPC for OpenSearch
   - VPC endpoints for AWS services
   - WAF for API protection

## Environment Variables
```bash
OPENAI_API_KEY=sk-xxx
OPENSEARCH_DOMAIN=xxx
AWS_REGION=xxx
```

## Cost Optimization
- Lambda provisioned concurrency for frequent operations
- OpenSearch instance sizing based on data volume
- S3 lifecycle policies for old documents
- DynamoDB auto-scaling

## Monitoring & Logging
- CloudWatch for Lambda logs
- X-Ray for request tracing
- CloudWatch alarms for errors
- Custom metrics for processing times

## Development Workflow
1. Local development using Amplify CLI
2. CI/CD pipeline with GitHub Actions
3. Staging and production environments
4. Automated testing before deployment

## Migration Steps
1. Set up Amplify Gen 2 project
2. Migrate authentication to Cognito
3. Create DynamoDB tables
4. Set up OpenSearch domain
5. Implement Lambda functions
6. Configure GraphQL API
7. Update frontend to use new APIs
8. Test and validate
9. Production deployment
