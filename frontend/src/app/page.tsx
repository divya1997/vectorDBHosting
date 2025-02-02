'use client';

import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  ChartBarIcon, 
  KeyIcon,
  MagnifyingGlassIcon,
  Square3Stack3DIcon as DatabaseIcon 
} from '@heroicons/react/24/outline';
import { UserProfile } from '@/components/layout/UserProfile';
import { CreateDatabaseModal } from '@/components/database/CreateDatabaseModal';
import { ApiKeyModal } from '@/components/database/ApiKeyModal';
import { formatBytes } from '@/utils/format';

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

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSector, setFilterSector] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState<{id: string, name: string} | null>(null);
  const [databases, setDatabases] = useState<Database[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDatabases();
  }, []);

  const fetchDatabases = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/database/list?user_id=user123');
      if (!response.ok) {
        throw new Error('Failed to fetch databases');
      }
      const data = await response.json();
      // Ensure we always have an array
      setDatabases(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching databases:', error);
      setDatabases([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDatabases = databases.filter(db => {
    const matchesSearch = db.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         db.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector = filterSector === 'all' || db.sector === filterSector;
    return matchesSearch && matchesSector;
  });

  const handleDatabaseCreated = (newDatabase: Database) => {
    setDatabases(prev => [...prev, newDatabase]);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      {/* Header with Profile */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Vector Database Library</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage your vector databases
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Database
          </button>
          <UserProfile />
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search databases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <select
          value={filterSector}
          onChange={(e) => setFilterSector(e.target.value)}
          className="rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">All Sectors</option>
          <option value="finance">Finance</option>
          <option value="health">Healthcare</option>
          <option value="technology">Technology</option>
          <option value="education">Education</option>
          <option value="articles">Articles</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Databases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-3 text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading databases...</p>
          </div>
        ) : filteredDatabases.length === 0 ? (
          <div className="col-span-3 text-center py-12">
            <DatabaseIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No databases</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating a new database.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Database
              </button>
            </div>
          </div>
        ) : (
          filteredDatabases.map((db) => (
            <div
              key={db.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 hover:border-primary/50 transition-all"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{db.name}</h3>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{db.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedDatabase({ id: db.id, name: db.name })}
                    className="text-primary hover:text-primary-dark p-1"
                    title="Manage API Key"
                  >
                    <KeyIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                    ${db.status === 'completed' ? 'bg-green-100 text-green-800' :
                      db.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'}`}>
                    {db.status}
                  </span>
                </div>

                <dl className="mt-4 space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <DatabaseIcon className="h-4 w-4 mr-2" />
                    <dt className="mr-1">Sector:</dt>
                    <dd className="font-medium text-gray-900 capitalize">{db.sector}</dd>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <ChartBarIcon className="h-4 w-4 mr-2" />
                    <dt className="mr-1">Documents:</dt>
                    <dd className="font-medium text-gray-900">{(db.document_count || 0).toLocaleString()}</dd>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <KeyIcon className="h-4 w-4 mr-2" />
                    <dt className="mr-1">Size:</dt>
                    <dd className="font-medium text-gray-900">{formatBytes(db.database_size || 0)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Database Modal */}
      <CreateDatabaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onDatabaseCreated={handleDatabaseCreated}
      />

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={selectedDatabase !== null}
        onClose={() => setSelectedDatabase(null)}
        databaseId={selectedDatabase?.id || ''}
        databaseName={selectedDatabase?.name || ''}
      />
    </div>
  );
}
