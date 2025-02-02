'use client';

import {
  ChartBarIcon,
  Square3Stack3DIcon as DatabaseIcon,
  ClockIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';
import { useUsage } from '@/hooks/useUsage';
import { format } from 'date-fns';
import { useDatabases } from '@/hooks/useDatabases';
import { useState } from 'react';

export default function UsagePage() {
  const { databases, loading: dbLoading, error: dbError } = useDatabases();
  const userId = "user123";
  const { usage, loading: usageLoading, error: usageError, refetch } = useUsage(userId);
  const [showFullKey, setShowFullKey] = useState<string | null>(null);

  const handleRefresh = () => {
    refetch();
  };

  const handleDownload = () => {
    const data = {
      timestamp: new Date().toISOString(),
      usage: usage,
      databases: databases
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usage-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (usageLoading || dbLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (usageError || dbError) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>Error loading usage data:</p>
        <p className="mt-2 text-sm">{usageError || dbError}</p>
      </div>
    );
  }

  // Calculate stats
  const totalQueries = usage?.total_queries || 0;
  const totalDatabases = databases?.length || 0;
  const recentQueries = usage?.history?.slice(-7).length || 0;

  const stats = [
    {
      name: 'Total Databases',
      value: totalDatabases.toString(),
      icon: DatabaseIcon,
    },
    {
      name: 'Total API Calls',
      value: totalQueries.toString(),
      icon: ChartBarIcon,
    },
    {
      name: 'Queries (Last 7 Days)',
      value: recentQueries.toString(),
      icon: ClockIcon,
    },
  ];

  // Format database usage
  const databaseUsage = Object.entries(usage?.databases || {}).map(([dbId, queries]) => {
    const database = databases?.find(db => db.id === dbId);
    return {
      id: dbId,
      name: database?.name || 'Unknown Database',
      queries: queries,
      lastUsed: usage?.history?.find(h => h.database_id === dbId)?.timestamp,
    };
  }).sort((a, b) => b.queries - a.queries);

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Usage & Analytics</h1>
          <p className="mt-2 text-sm text-gray-600">
            Monitor your database usage and API calls
          </p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={handleDownload}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Download Report
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-lg">
                <stat.icon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Database Usage Table */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900">Database Usage</h2>
          <p className="mt-1 text-sm text-gray-600">
            Detailed usage statistics for each database
          </p>
        </div>
        <div className="border-t border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Database
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Queries
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Used
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {databaseUsage.map((db) => (
                <tr key={db.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {db.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {db.queries.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {db.lastUsed ? format(new Date(db.lastUsed), 'PPP p') : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
          <p className="mt-1 text-sm text-gray-600">
            Latest API calls and database queries
          </p>
        </div>
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            {usage?.history?.slice(-10).reverse().map((activity, index) => {
              const database = databases?.find(db => db.id === activity.database_id);
              const truncatedKey = activity.api_key.slice(0, 8) + '...';
              return (
                <li key={index} className="px-6 py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <ChartBarIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Query to {database?.name || 'Unknown Database'}
                      </p>
                      <div 
                        className="text-sm text-gray-500 cursor-pointer"
                        onClick={() => setShowFullKey(showFullKey === activity.api_key ? null : activity.api_key)}
                        title={showFullKey === activity.api_key ? "Click to hide" : "Click to show full key"}
                      >
                        API Key: {showFullKey === activity.api_key ? activity.api_key : truncatedKey}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(activity.timestamp), 'PPP p')}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
