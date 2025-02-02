import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

// Generate a typed client for data operations
export const dataClient = generateClient<Schema>();

// Database operations
export const databaseOperations = {
  // Create a new database
  createDatabase: async (input: {
    name: string;
    description: string;
    sector: string;
  }) => {
    return await dataClient.models.Database.create({
      ...input,
      status: 'ACTIVE',
      documentCount: 0,
      databaseSize: 0,
      createdBy: 'current-user', // TODO: Get from auth context
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  },

  // List all databases with real-time updates
  observeDatabases: () => {
    return dataClient.models.Database.observeQuery();
  },

  // Update database
  updateDatabase: async (id: string, input: Partial<Schema['Database']['type']>) => {
    return await dataClient.models.Database.update({
      id,
      ...input,
      updatedAt: new Date().toISOString()
    });
  },

  // Delete database
  deleteDatabase: async (id: string) => {
    return await dataClient.models.Database.delete({ id });
  }
};

// Document operations
export const documentOperations = {
  // Create a new document
  createDocument: async (input: {
    databaseId: string;
    filename: string;
    fileSize: number;
    fileType: string;
    s3Key: string;
  }) => {
    return await dataClient.models.Document.create({
      ...input,
      status: 'PROCESSING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  },

  // List documents for a database with real-time updates
  observeDocuments: (databaseId: string) => {
    return dataClient.models.Document.observeQuery({
      filter: {
        databaseId: { eq: databaseId }
      }
    });
  },

  // Update document status
  updateDocument: async (id: string, input: Partial<Schema['Document']['type']>) => {
    return await dataClient.models.Document.update({
      id,
      ...input,
      updatedAt: new Date().toISOString()
    });
  },

  // Delete document
  deleteDocument: async (id: string) => {
    return await dataClient.models.Document.delete({ id });
  }
};

// API Key operations
export const apiKeyOperations = {
  // Create a new API key
  createApiKey: async (input: {
    databaseId: string;
    expiresInDays?: number;
  }) => {
    return await dataClient.models.ApiKey.create({
      ...input,
      key: generateApiKey(), // TODO: Implement secure key generation
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + (input.expiresInDays || 30) * 24 * 60 * 60 * 1000).toISOString()
    });
  },

  // List API keys for a database
  observeApiKeys: (databaseId: string) => {
    return dataClient.models.ApiKey.observeQuery({
      filter: {
        databaseId: { eq: databaseId }
      }
    });
  },

  // Delete API key
  deleteApiKey: async (id: string) => {
    return await dataClient.models.ApiKey.delete({ id });
  }
};

// Helper function to generate API keys (placeholder)
function generateApiKey(): string {
  return 'api-key-' + Math.random().toString(36).substring(2);
}
