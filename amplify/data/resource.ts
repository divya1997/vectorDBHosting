import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/**
 * Define the schema for VectorDBBuilder
 * - Database: Represents a vector database instance
 * - Document: Represents a document in a database
 * - ApiKey: Represents an API key for database access
 * - Usage: Tracks API usage and quotas
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
      
      // Configuration
      embeddingModel: a.string(),
      maxTokens: a.integer(),
      similarityMetric: a.string(),
      
      // Metrics
      documentCount: a.integer(),
      databaseSize: a.float(),
      totalTokens: a.integer(),
      
      // Relationships
      documents: a.hasMany('Document'),
      apiKeys: a.hasMany('ApiKey'),
      usage: a.hasMany('Usage'),
      
      // Ownership and timestamps
      ownerId: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime()
    })
    .authorization([
      a.allow.owner(),
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
      
      // Storage and processing
      s3Key: a.string(),
      status: a.string(),
      processingError: a.string().optional(),
      
      // Vector data
      vectorCount: a.integer(),
      vectorDimensions: a.integer(),
      
      // Relationships
      database: a.belongsTo('Database'),
      
      // Timestamps
      createdAt: a.datetime(),
      updatedAt: a.datetime()
    })
    .authorization([
      a.allow.owner(),
      a.allow.public().to(['read'])
    ]),

  ApiKey: a
    .model({
      // Basic information
      id: a.string(),
      databaseId: a.string(),
      name: a.string(),
      key: a.string(),
      
      // Permissions
      permissions: a.string().array(),
      rateLimit: a.integer(),
      
      // Relationships
      database: a.belongsTo('Database'),
      usage: a.hasMany('Usage'),
      
      // Status and timestamps
      status: a.string(),
      createdAt: a.datetime(),
      expiresAt: a.datetime(),
      lastUsedAt: a.datetime().optional()
    })
    .authorization([
      a.allow.owner()
    ]),

  Usage: a
    .model({
      // Basic information
      id: a.string(),
      databaseId: a.string(),
      apiKeyId: a.string(),
      
      // Usage metrics
      requestCount: a.integer(),
      tokenCount: a.integer(),
      storageUsed: a.float(),
      
      // Relationships
      database: a.belongsTo('Database'),
      apiKey: a.belongsTo('ApiKey'),
      
      // Time period
      periodStart: a.datetime(),
      periodEnd: a.datetime()
    })
    .authorization([
      a.allow.owner()
    ])
});

// Export schema type for frontend use
export type Schema = ClientSchema<typeof schema>;

// Define and export the data configuration
export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "AMAZON_COGNITO_USER_POOLS",
    apiKeyAuthorizationMode: {
      expiresInDays: 30
    }
  }
});
