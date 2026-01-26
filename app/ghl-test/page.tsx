'use client';

import { useEffect, useState } from 'react';
import { GhlContactsTable } from '@/components/ghl/GhlContactsTable';
import { GhlOpportunitiesTable } from '@/components/ghl/GhlOpportunitiesTable';
import { getAccessToken, isAuthenticated, fetchUsers } from '@/lib/ghl-client';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function GhlTestPage() {
  const [data, setData] = useState<any>(null);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [customFieldsSchema, setCustomFieldsSchema] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [funnels, setFunnels] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchContacts = async () => {
    setLoading(true);
    setError('');
    try {
      const token = getAccessToken() || 'pit-2649ae7e-b7c9-4422-bcb8-1566ed0c2137';
      const isAuth = isAuthenticated();

      let allContacts: any[] = [];

      if (isAuth) {
        // Authenticated: fetch all with pagination
        let offset = 0;
        const limit = 100;
        while (true) {
          const response = await fetch(`https://services.leadconnectorhq.com/contacts/?locationId=39lrobFR8QYqHc02whFb&limit=${limit}&offset=${offset}`, {
            headers: {
              'Accept': 'application/json',
              'Version': '2021-07-28',
              'Authorization': `Bearer ${token}`,
            },
          });
          if (!response.ok) throw new Error(`Error: ${response.status}`);
          const result = await response.json();
          const contacts = result.contacts || [];
          allContacts.push(...contacts);
          if (contacts.length < limit) break;
          offset += limit;
        }
      } else {
        // Not authenticated: fetch default 20
        const response = await fetch('https://services.leadconnectorhq.com/contacts/?locationId=39lrobFR8QYqHc02whFb', {
          headers: {
            'Accept': 'application/json',
            'Version': '2021-07-28',
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const result = await response.json();
        allContacts = result.contacts || [];
      }

      setData({ contacts: allContacts });

      // Fetch custom fields schema
      const schemaResponse = await fetch('https://services.leadconnectorhq.com/locations/39lrobFR8QYqHc02whFb/customFields', {
        headers: {
          'Accept': 'application/json',
          'Version': '2021-07-28',
          'Authorization': `Bearer ${token}`,
        },
      });
      const schema = await schemaResponse.json();
      setCustomFieldsSchema(schema.customFields || []);

      // Fetch users
      const usersData = await fetchUsers(token, '39lrobFR8QYqHc02whFb');
      setUsers(Array.isArray(usersData) ? usersData : usersData.users || []);

      // Fetch opportunities
      const opportunitiesResponse = await fetch('https://services.leadconnectorhq.com/opportunities/search?location_id=39lrobFR8QYqHc02whFb', {
        headers: {
          'Accept': 'application/json',
          'Version': '2021-07-28',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!opportunitiesResponse.ok) throw new Error(`Opportunities Error: ${opportunitiesResponse.status}`);
      const opportunitiesResult = await opportunitiesResponse.json();
      setOpportunities(opportunitiesResult.opportunities || []);

      // Fetch pipelines
      const pipelinesResponse = await fetch('https://services.leadconnectorhq.com/opportunities/pipelines?locationId=39lrobFR8QYqHc02whFb', {
        headers: {
          'Accept': 'application/json',
          'Version': '2021-07-28',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!pipelinesResponse.ok) throw new Error(`Pipelines Error: ${pipelinesResponse.status}`);
      const pipelinesResult = await pipelinesResponse.json();
      setPipelines(pipelinesResult.pipelines || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const getTierCounts = () => {
    if (!data?.contacts) return {};
    return data.contacts.reduce((acc: any, contact: any) => {
      const tier = getCustomField(contact.customFields, '1LOXTxCo9Mw7lH97x9QH');
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    }, {});
  };

  const getCustomField = (customFields: any[], id: string) => {
    const field = customFields?.find((f: any) => f.id === id);
    return field ? field.value : 'N/A';
  };

  // Utility functions to connect relations
  const getContactById = (contactId: string) => {
    return data?.contacts?.find((c: any) => c.id === contactId);
  };

  const getUserById = (userId: string) => {
    return users.find((u: any) => u.id === userId);
  };

  const getStageById = (pipelineId: string, stageId: string) => {
    const pipeline = pipelines.find((p: any) => p.id === pipelineId);
    return pipeline?.stages?.find((s: any) => s.id === stageId);
  };

  const getPipelineById = (pipelineId: string) => {
    return pipelines.find((p: any) => p.id === pipelineId);
  };

  // Connected data
  const opportunitiesWithRelations = opportunities.map((opp: any) => ({
    ...opp,
    contact: getContactById(opp.contact?.id) || opp.contact,
    assignedUser: getUserById(opp.assignedTo),
    stage: getStageById(opp.pipelineId, opp.pipelineStageId),
    pipeline: getPipelineById(opp.pipelineId),
  }));

  const contactsWithOpportunities = data?.contacts?.map((contact: any) => ({
    ...contact,
    opportunities: opportunities.filter((opp: any) => opp.contact?.id === contact.id || opp.relations?.[0]?.contactId === contact.id),
  })) || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">GHL Sales Dashboard</h1>
          <div className="flex gap-3">
            {!isAuthenticated() && (
              <button
                onClick={() => window.location.href = '/api/ghl/auth'}
                className="px-6 py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-200"
              >
                Connect GHL
              </button>
            )}
            <button
              onClick={fetchContacts}
              className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg shadow-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}

        {data && (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="text-sm font-medium text-gray-500 mb-1 uppercase tracking-wider">Total Contacts</div>
                <div className="text-3xl font-bold text-blue-600">{data.contacts?.length || 0}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="text-sm font-medium text-gray-500 mb-1 uppercase tracking-wider">Total Opportunities</div>
                <div className="text-3xl font-bold text-green-600">{opportunities.length}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="text-sm font-medium text-gray-500 mb-1 uppercase tracking-wider">Total Users</div>
                <div className="text-3xl font-bold text-purple-600">{users.length}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="text-sm font-medium text-gray-500 mb-1 uppercase tracking-wider">Total Pipelines</div>
                <div className="text-3xl font-bold text-indigo-600">{pipelines.length}</div>
              </div>
            </div>

            {/* Main Content Tabs/Sections */}
            <div className="space-y-10">
              {/* Opportunities Section */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">Sales Opportunities</h2>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                    {opportunities.length} Active
                  </span>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <GhlOpportunitiesTable 
                    opportunities={opportunities} 
                    customFieldsSchema={customFieldsSchema} 
                    users={users}
                    pipelines={pipelines}
                  />
                </div>
              </section>

              {/* Pipelines Visualization */}
              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Pipeline Structure</h2>
                <div className="grid grid-cols-1 gap-8">
                  {pipelines.map((pipeline: any) => (
                    <div key={pipeline.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900">{pipeline.name}</h3>
                        <div className="text-sm text-gray-500">{pipeline.stages?.length} Stages</div>
                      </div>
                      <div className="flex overflow-x-auto pb-4 gap-4 snap-x">
                        {pipeline.stages.map((stage: any) => (
                          <div key={stage.id} className="flex-shrink-0 w-64 bg-gray-50 rounded-xl p-4 border border-gray-200 snap-start">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                Stage {stage.position + 1}
                              </span>
                            </div>
                            <div className="font-bold text-gray-800 text-sm mb-4 h-10 line-clamp-2">{stage.name}</div>
                            <div className="text-xs text-gray-500 flex justify-between items-center">
                              <span>Opps: {opportunities.filter(o => o.pipelineStageId === stage.id).length}</span>
                              <span className="font-mono text-[10px]">{stage.id.substring(0, 8)}...</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Contacts Section */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">Contact Directory</h2>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                    {data.contacts?.length || 0} Total
                  </span>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <GhlContactsTable contacts={data.contacts || []} customFieldsSchema={customFieldsSchema} />
                </div>
              </section>

              {/* Team Section */}
              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Team Members</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.isArray(users) && users.map((user: any) => (
                    <div key={user.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {user.name?.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="mt-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {user.roles?.role || 'User'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}

        {loading && !data && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">Syncing with GoHighLevel...</p>
          </div>
        )}
      </div>
    </div>
  );
}