import { useState, useEffect } from 'react';
import { databaseOperations } from '@/utils/amplifyDataClient';
import type { Schema } from '../../amplify/data/resource';

export function useDatabase() {
  const [databases, setDatabases] = useState<Schema['Database']['type'][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const subscription = databaseOperations.observeDatabases().subscribe({
      next: ({ items, isSynced }) => {
        setDatabases(items);
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
  }, []);

  const createDatabase = async (input: {
    name: string;
    description: string;
    sector: string;
  }) => {
    try {
      const newDatabase = await databaseOperations.createDatabase(input);
      return newDatabase;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const updateDatabase = async (
    id: string,
    input: Partial<Schema['Database']['type']>
  ) => {
    try {
      const updatedDatabase = await databaseOperations.updateDatabase(id, input);
      return updatedDatabase;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const deleteDatabase = async (id: string) => {
    try {
      await databaseOperations.deleteDatabase(id);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return {
    databases,
    loading,
    error,
    createDatabase,
    updateDatabase,
    deleteDatabase,
  };
}
