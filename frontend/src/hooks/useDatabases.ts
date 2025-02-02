import { useState, useEffect, useCallback } from 'react';

interface Database {
  id: string;
  name: string;
  description: string;
  sector: string;
  file_count: number;
  document_count: number;
  total_file_size: number;
  database_size: number;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useDatabases(userId?: string, pausePolling: boolean = true) {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDatabases = useCallback(async () => {
    try {
      setLoading(true);
      const url = userId 
        ? `http://localhost:8000/api/v1/database/list?user_id=${userId}`
        : 'http://localhost:8000/api/v1/database/list';
        
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch databases');
      }
      const data = await response.json();
      // Ensure we always have an array
      setDatabases(Array.isArray(data) ? data : []);
      setError(null);
    } catch (error) {
      console.error('Error fetching databases:', error);
      setError('Failed to fetch databases');
      setDatabases([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDatabases();
    
    // Set up polling only if not paused
    if (!pausePolling) {
      const interval = setInterval(fetchDatabases, 5000);
      return () => clearInterval(interval);
    }
  }, [fetchDatabases, pausePolling]);

  return {
    databases,
    loading,
    error,
    refreshDatabases: fetchDatabases
  };
}
