# Amplify Gen 2 Implementation Guide

This guide is based on a working implementation of AWS Amplify Gen 2 and provides a structured approach for implementing similar functionality in other projects.

## Table of Contents
- [Project Structure](#project-structure)
- [Backend Configuration](#backend-configuration)
- [Authentication Configuration](#authentication-configuration)
- [Data Configuration](#data-configuration)
- [Frontend Integration](#frontend-integration)
- [Implementation Steps](#implementation-steps)
- [Best Practices](#best-practices)

## Project Structure

```
amplify/
├── auth/
│   └── resource.ts      # Auth configuration
├── data/
│   └── resource.ts      # Data models and schema
├── backend.ts           # Main backend configuration
├── package.json
└── tsconfig.json
```

## Backend Configuration

The main backend configuration file (`amplify/backend.ts`) combines all resources:

```typescript
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

defineBackend({
  auth,
  data,
});
```

## Authentication Configuration

Auth configuration (`amplify/auth/resource.ts`) provides user authentication:

```typescript
import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
});
```

Key Features:
- Email-based authentication
- Simple configuration
- No complex password policies by default
- Optional MFA support

## Data Configuration

Data configuration (`amplify/data/resource.ts`) defines your data models:

```typescript
import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

// Schema definition
const schema = a.schema({
  ModelName: a
    .model({
      // Field definitions
      id: a.string(),
      name: a.string(),
      description: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      // Authorization rules
      allow.publicApiKey(),
      // or
      allow.owner(),
      // or
      allow.authenticated()
    ]),
});

// Type export for frontend
export type Schema = ClientSchema<typeof schema>;

// Data configuration
export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
```

Available Field Types:
- `a.string()` - String fields
- `a.number()` - Numeric fields
- `a.boolean()` - Boolean fields
- `a.datetime()` - Date/time fields
- `a.id()` - ID fields

Authorization Rules:
- `allow.publicApiKey()` - Public access with API key
- `allow.owner()` - Owner-based access
- `allow.authenticated()` - Any authenticated user
- `allow.private()` - Private access

## Frontend Integration

### 1. Configure Amplify

In your main entry file (e.g., `src/main.ts`):

```typescript
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";

Amplify.configure(outputs);
```

### 2. Using the Data Client

In your components:

```typescript
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

// Generate typed client
const client = generateClient<Schema>();

// CRUD Operations Examples:

// Create
async function createItem() {
  await client.models.ModelName.create({
    name: "New Item",
    description: "Description"
  });
}

// Read with real-time updates
function subscribeToItems() {
  client.models.ModelName.observeQuery().subscribe({
    next: ({ items, isSynced }) => {
      // Handle items
      console.log('Items:', items);
      console.log('Synced:', isSynced);
    },
  });
}

// Update
async function updateItem(id: string) {
  await client.models.ModelName.update({
    id,
    name: "Updated Name"
  });
}

// Delete
async function deleteItem(id: string) {
  await client.models.ModelName.delete({ id });
}
```

## Implementation Steps

1. **Set Up Project Structure**:
   ```bash
   mkdir -p amplify/{auth,data}
   touch amplify/backend.ts
   touch amplify/auth/resource.ts
   touch amplify/data/resource.ts
   ```

2. **Install Dependencies**:
   ```bash
   npm install aws-amplify @aws-amplify/backend
   ```

3. **Configure Backend**:
   - Create backend.ts
   - Set up auth configuration
   - Define data models
   - Configure authorization

4. **Frontend Setup**:
   - Configure Amplify
   - Generate and use data client
   - Implement CRUD operations
   - Add real-time subscriptions

## Best Practices

1. **Schema Design**:
   - Keep models focused and simple
   - Use appropriate field types
   - Consider relationships between models
   - Plan authorization rules carefully

2. **Type Safety**:
   - Always export and use Schema types
   - Use the schema builder for type safety
   - Leverage TypeScript for better development experience

3. **Authorization**:
   - Use the least privileged access
   - Consider different access patterns
   - Implement proper owner-based access where needed

4. **Real-time Updates**:
   - Use `observeQuery()` for real-time data
   - Handle sync status appropriately
   - Consider offline capabilities

5. **Code Organization**:
   - Keep resources in separate files
   - Use clear naming conventions
   - Document complex configurations
   - Follow modular design principles

## Common Patterns

1. **Real-time List**:
```typescript
const items = ref<Array<Schema['ModelName']['type']>>([]);

onMounted(() => {
  client.models.ModelName.observeQuery().subscribe({
    next: ({ items: newItems }) => {
      items.value = newItems;
    },
  });
});
```

2. **Create with Validation**:
```typescript
async function createItem(data: Partial<Schema['ModelName']['type']>) {
  try {
    await client.models.ModelName.create(data);
    // Handle success
  } catch (error) {
    // Handle error
    console.error('Failed to create item:', error);
  }
}
```

3. **Owner-based Access**:
```typescript
const schema = a.schema({
  ModelName: a
    .model({
      // fields...
    })
    .authorization([
      allow.owner(),
      allow.public().to(['read']),
    ]),
});
```

## Troubleshooting

1. **Type Errors**:
   - Ensure Schema is properly exported
   - Use correct field types in schema
   - Check for proper type imports

2. **Authorization Errors**:
   - Verify auth configuration
   - Check authorization rules
   - Ensure proper user authentication

3. **Real-time Updates**:
   - Confirm subscription setup
   - Check network connectivity
   - Verify proper cleanup in components

## Resources

- [Amplify Gen 2 Documentation](https://docs.amplify.aws/gen2/)
- [Data API Reference](https://docs.amplify.aws/gen2/build-a-backend/data/)
- [Authentication Guide](https://docs.amplify.aws/gen2/build-a-backend/auth/)
