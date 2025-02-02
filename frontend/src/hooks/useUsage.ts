import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '@/config';

export interface UsageData {
  total_queries: number;
  databases: {
    [key: string]: number;
  };
  history: Array<{
    timestamp: string;
    database_id: string;
    api_key: string;
  }>;
}

export function useUsage(userId: string) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching usage data for user:', userId);
      const response = await axios.get(`${API_BASE_URL}/api/v1/database/usage/${userId}`);
      console.log('Usage response:', response.data);
      setUsage(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching usage:', err);
      if (axios.isAxiosError(err)) {
        console.error('Response data:', err.response?.data);
        setError(err.response?.data?.detail || err.message);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch usage data');
      }
      setUsage(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchUsage();
    }
  }, [userId, fetchUsage]);

  return { usage, loading, error, refetch: fetchUsage };
}
