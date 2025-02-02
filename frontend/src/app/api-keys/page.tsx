'use client';

import { useState, useEffect } from 'react';
import { KeyIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import format from 'date-fns/format';

interface ApiKey {
  database_id: string;
  database_name: string;
  key: string;
  created_at: string;
}

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Fetch API keys
  useEffect(() => {
    const fetchApiKeys = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8000/api/v1/database/user/user123/api-keys');
        if (!response.ok) {
          throw new Error('Failed to fetch API keys');
        }
        const data = await response.json();
        setApiKeys(data.keys);
      } catch (error) {
        setError('Failed to load API keys');
        console.error('Error fetching API keys:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApiKeys();
  }, []);

  // Copy key to clipboard
  const copyToClipboard = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">API Keys</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your API keys for all databases
        </p>
      </div>

      {/* API Keys List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {error ? (
          <div className="p-6 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading API keys...</p>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="p-6 text-center">
            <KeyIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No API keys</h3>
            <p className="mt-1 text-sm text-gray-500">
              Generate API keys from your database cards
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Database
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    API Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {apiKeys.map((key) => (
                  <tr key={key.database_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <KeyIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div className="text-sm font-medium text-gray-900">{key.database_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm font-mono text-gray-600">
                        {key.key.substring(0, 10)}...{key.key.substring(key.key.length - 10)}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(key.created_at), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => copyToClipboard(key.key)}
                          className="text-primary hover:text-primary-dark"
                          title="Copy API Key"
                        >
                          <ClipboardIcon className="h-5 w-5" />
                        </button>
                        {copiedKey === key.key && (
                          <span className="text-green-600 text-xs">Copied!</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
