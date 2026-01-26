'use client';

import { useState, useEffect } from 'react';
import { GhlDataTable } from './GhlDataTable';
import { ghlFetch, getAccessToken } from '@/lib/ghl-client';

const sections = [
  { id: 'businesses', label: 'Businesses', endpoint: '/businesses', columns: [{key:'id',label:'ID'},{key:'name',label:'Name'},{key:'address',label:'Address'},{key:'phone',label:'Phone'}] },
  { id: 'contacts', label: 'Contacts', endpoint: '/contacts?limit=30', columns: [{key:'name',label:'Name'},{key:'email',label:'Email'},{key:'phone',label:'Phone'},{key:'tags',label:'Tags'},{key:'date_created',label:'Date Created'}] },
  { id: 'payments', label: 'Payments/Transactions', endpoint: '/payments/transactions?limit=30', columns: [{key:'id',label:'ID'},{key:'amount',label:'Amount'},{key:'status',label:'Status'},{key:'date_created',label:'Date Created'}], hasTotal: true },
  { id: 'opportunities', label: 'Opportunities', endpoint: '/opportunities?limit=20', columns: [{key:'title',label:'Title'},{key:'value',label:'Value'},{key:'stage',label:'Stage'},{key:'contact',label:'Contact'}] },
  { id: 'users', label: 'Users', endpoint: '/users', columns: [{key:'name',label:'Name'},{key:'email',label:'Email'},{key:'role',label:'Role'}] },
];

export function GhlDashboardTabs() {
  const [activeTab, setActiveTab] = useState('businesses');
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, string>>({});
  const [showRaw, setShowRaw] = useState<Record<string, boolean>>({});

  const fetchData = async (sectionId: string) => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(prev => ({ ...prev, [sectionId]: true }));
    setError(prev => ({ ...prev, [sectionId]: '' }));
    try {
      const result = await ghlFetch(sections.find(s => s.id === sectionId)!.endpoint, token);
      setData(prev => ({ ...prev, [sectionId]: result }));
    } catch (err: any) {
      setError(prev => ({ ...prev, [sectionId]: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, [sectionId]: false }));
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const refresh = (sectionId: string) => fetchData(sectionId);
  const toggleRaw = (sectionId: string) => setShowRaw(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {sections.map(s => (
          <button
            key={s.id}
            className={`px-4 py-2 ${activeTab === s.id ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveTab(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>
      {sections.map(s => (
        activeTab === s.id && (
          <div key={s.id} className="space-y-4">
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-blue-500 text-white" onClick={() => refresh(s.id)}>Refresh</button>
              <button className="px-4 py-2 bg-gray-200" onClick={() => toggleRaw(s.id)}>Toggle Raw JSON</button>
            </div>
            {loading[s.id] && <div className="h-64 bg-gray-200 animate-pulse"></div>}
            {error[s.id] && <div className="p-4 bg-red-100 text-red-700">{error[s.id]}</div>}
            {data[s.id] && !showRaw[s.id] && (
              <>
                {s.hasTotal && (
                  <div className="p-4 border rounded">
                    <h3 className="font-bold">Total Revenue</h3>
                    <p>{data[s.id].reduce((sum: number, p: any) => sum + (p.amount || 0), 0)}</p>
                  </div>
                )}
                <GhlDataTable data={data[s.id]} columns={s.columns} />
              </>
            )}
            {showRaw[s.id] && <pre className="p-4 bg-gray-100">{JSON.stringify(data[s.id], null, 2)}</pre>}
          </div>
        )
      ))}
    </div>
  );
}