import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/**
 * Define the schema for VectorDBBuilder
 * - Database: Represents a vector database instance
 * - Document: Represents a document in a database
 * - ApiKey: Represents an API key for database access
 */
const schema = a.schema({
  Database: a
    .model({
      // Basic information
      id: a.string(),
      name: a.string(),
      description: a.string(),
      sector: a.string(),
      status: a.string(),
      
      // Metrics
      documentCount: a.integer(),
      databaseSize: a.float(),
      
      // Ownership and timestamps
      createdBy: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime()
    })
    .authorization([
      // Allow authenticated users to create and manage their databases
      a.allow.owner(),
      // Allow public read for discovery
      a.allow.public().to(['read'])
    ]),

  Document: a
    .model({
      // Basic information
      id: a.string(),
      databaseId: a.string(),
      filename: a.string(),
      fileSize: a.integer(),
      fileType: a.string(),
      
      // Storage
      s3Key: a.string(),
      status: a.string(),
      
      // Timestamps
      createdAt: a.datetime(),
      updatedAt: a.datetime()
    })
    .authorization([
      // Allow database owners to manage documents
      a.allow.owner(),
      // Allow public read for search
      a.allow.public().to(['read'])
    ]),

  ApiKey: a
    .model({
      // Basic information
      id: a.string(),
      databaseId: a.string(),
      key: a.string(),
      
      // Timestamps
      createdAt: a.datetime(),
      expiresAt: a.datetime()
    })
    .authorization([
      // Only allow owners to manage API keys
      a.allow.owner()
    ])
});

// Export schema type for frontend use
export type Schema = ClientSchema<typeof schema>;

// Define and export the data configuration
export const data = defineData({
  schema,
  authorizationModes: {
    // Use Cognito User Pool as default auth mode
    defaultAuthorizationMode: "AMAZON_COGNITO_USER_POOLS",
    // Enable API key auth for public access
    apiKeyAuthorizationMode: {
      expiresInDays: 30
    }
  }
});
