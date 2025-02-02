export interface User {
  email: string;
  is_active: boolean;
  is_admin: boolean;
}

export interface Dataset {
  id: number;
  name: string;
  description?: string;
  isPublic: boolean;
  filePath: string;
  vectorDbPath: string;
  createdAt: string;
  ownerId: number;
}

export interface APIKey {
  id: number;
  key: string;
  name: string;
  createdAt: string;
  lastUsed?: string;
}

export interface UsageRecord {
  id: number;
  datasetId: number;
  queryCount: number;
  embeddingCount: number;
  storageSize: number;
  timestamp: string;
}
