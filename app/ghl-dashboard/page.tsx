'use client';

import { useEffect, useState, useCallback } from 'react';
import { GhlContactsTable } from '@/components/ghl/GhlContactsTable';
import { GhlOpportunitiesTable } from '@/components/ghl/GhlOpportunitiesTable';
import { getAccessToken, isAuthenticated, fetchGhlData, logout } from '@/lib/ghl-client';

export default function GhlDashboardPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [customFieldsSchema, setCustomFieldsSchema] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationId, setLocationId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const token = getAccessToken();
    const locId = localStorage.getItem('ghl_location_id');
    
    if (!token || !locId) {
      setError('Not authenticated with GHL');
      return;
    }

    setLocationId(locId);
    setLoading(true);
    setError('');

    try {
      // Fetch Contacts
      const contactsData = await fetchGhlData(`/contacts/?locationId=${locId}&limit=100`, token);
      setContacts(contactsData.contacts || []);

      // Fetch Custom Fields
      const schemaData = await fetchGhlData(`/locations/${locId}/customFields`, token);
      setCustomFieldsSchema(schemaData.customFields || []);

      // Fetch Users
      const usersData = await fetchGhlData(`/users/?locationId=${locId}`, token);
      setUsers(usersData.users || []);

      // Fetch Opportunities
      const opportunitiesData = await fetchGhlData(`/opportunities/search?location_id=${locId}`, token);
      setOpportunities(opportunitiesData.opportunities || []);

      // Fetch Pipelines
      const pipelinesData = await fetchGhlData(`/opportunities/pipelines?locationId=${locId}`, token);
      setPipelines(pipelinesData.pipelines || []);

    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message);
      if (err.message.includes('401')) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated()) {
      fetchData();
    }
  }, [fetchData]);

  const handleConnect = () => {
    window.location.href = '/api/ghl/auth';
  };

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md w-full">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">GHL Integration</h1>
          <p className="text-gray-600 mb-8">Connect your GoHighLevel account to sync contacts and opportunities.</p>
          <button
            onClick={handleConnect}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
          >
            Connect GoHighLevel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">GHL Sales Dashboard</h1>
            <p className="text-gray-500 mt-1">Location ID: {locationId}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchData}
              className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
            <button
              onClick={handleLogout}
              className="px-6 py-2.5 bg-white text-gray-700 border border-gray-200 font-semibold rounded-xl hover:bg-gray-50 transition-all"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg shadow-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600 font-medium">Syncing with GoHighLevel...</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-sm font-medium text-gray-500 mb-1 uppercase">Contacts</div>
                <div className="text-3xl font-bold text-blue-600">{contacts.length}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-sm font-medium text-gray-500 mb-1 uppercase">Opportunities</div>
                <div className="text-3xl font-bold text-green-600">{opportunities.length}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-sm font-medium text-gray-500 mb-1 uppercase">Users</div>
                <div className="text-3xl font-bold text-purple-600">{users.length}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-sm font-medium text-gray-500 mb-1 uppercase">Pipelines</div>
                <div className="text-3xl font-bold text-indigo-600">{pipelines.length}</div>
              </div>
            </div>

            {/* Opportunities */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Sales Opportunities</h2>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <GhlOpportunitiesTable 
                  opportunities={opportunities} 
                  customFieldsSchema={customFieldsSchema} 
                  users={users}
                  pipelines={pipelines}
                />
              </div>
            </section>

            {/* Contacts */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Contact Directory</h2>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <GhlContactsTable contacts={contacts} customFieldsSchema={customFieldsSchema} />
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
