import { useState, useEffect } from 'react';
import { documentOperations } from '@/utils/amplifyDataClient';
import type { Schema } from '../../amplify/data/resource';

export function useDocuments(databaseId: string) {
  const [documents, setDocuments] = useState<Schema['Document']['type'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!databaseId) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    const subscription = documentOperations.observeDocuments(databaseId).subscribe({
      next: ({ items, isSynced }) => {
        setDocuments(items);
        if (isSynced) {
          setLoading(false);
        }
      },
      error: (err) => {
        setError(err);
        setLoading(false);
      },
    });

    return () => subscription.unsubscribe();
  }, [databaseId]);

  const createDocument = async (input: {
    filename: string;
    fileSize: number;
    fileType: string;
    s3Key: string;
  }) => {
    try {
      const newDocument = await documentOperations.createDocument({
        ...input,
        databaseId,
      });
      return newDocument;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const updateDocument = async (
    id: string,
    input: Partial<Schema['Document']['type']>
  ) => {
    try {
      const updatedDocument = await documentOperations.updateDocument(id, input);
      return updatedDocument;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      await documentOperations.deleteDocument(id);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return {
    documents,
    loading,
    error,
    createDocument,
    updateDocument,
    deleteDocument,
  };
}
