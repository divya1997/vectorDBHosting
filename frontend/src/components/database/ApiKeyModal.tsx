'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { KeyIcon, ClipboardIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  databaseId: string;
  databaseName: string;
}

export function ApiKeyModal({ isOpen, onClose, databaseId, databaseName }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch existing API key on mount
  const fetchApiKey = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/v1/database/${databaseId}/api-key?user_id=user123`);
      if (!response.ok) {
        throw new Error('Failed to fetch API key');
      }
      const data = await response.json();
      
      // If no key exists, generate one automatically
      if (!data.api_key) {
        await generateApiKey();
        return;
      }
      
      setApiKey(data.api_key);
    } catch (error) {
      setError('Failed to fetch API key');
      console.error('Error fetching API key:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate new API key
  const generateApiKey = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/v1/database/${databaseId}/generate-key?user_id=user123`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to generate API key');
      }
      const data = await response.json();
      setApiKey(data.api_key);
      setCopied(false);
    } catch (error) {
      setError('Failed to generate API key');
      console.error('Error generating API key:', error);
    } finally {
      setLoading(false);
    }
  };

  // Copy API key to clipboard
  const copyToClipboard = async () => {
    if (apiKey) {
      try {
        await navigator.clipboard.writeText(apiKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
    }
  };

  // Reset state when modal closes
  const handleClose = () => {
    setApiKey(null);
    setError(null);
    setCopied(false);
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      fetchApiKey();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-medium">
              API Key for {databaseName}
            </Dialog.Title>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            {error ? (
              <div className="text-sm text-red-600">{error}</div>
            ) : loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : apiKey ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                  <code className="flex-1 text-sm font-mono break-all">{apiKey}</code>
                  <button
                    onClick={copyToClipboard}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Copy to clipboard"
                  >
                    <ClipboardIcon className="h-5 w-5" />
                  </button>
                </div>
                {copied && (
                  <p className="text-sm text-green-600">Copied to clipboard!</p>
                )}
                <p className="text-sm text-gray-500">
                  Keep this key secure. You can generate a new key at any time, but this will invalidate the old one.
                </p>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={generateApiKey}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50"
                  >
                    <KeyIcon className="h-4 w-4" />
                    Generate New Key
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            )}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
