'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { GhlOpportunitiesTable } from '@/components/ghl/GhlOpportunitiesTable';
import { GhlContactsTable } from '@/components/ghl/GhlContactsTable';

export default function GhlTestTablePage() {
  const searchParams = useSearchParams();
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'opportunities' | 'contacts'>('contacts');

  useEffect(() => {
    const locationId = searchParams.get('locationId');
    const token = searchParams.get('token');
    const limit = searchParams.get('limit') || '100';

    if (!locationId || !token) {
      setError('Missing locationId or token in URL');
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        setLoading(true);
        // Fetch opportunities
        const oppRes = await fetch(`/api/ghl/test-sdk?locationId=${locationId}&token=${token}&limit=${limit}&type=opportunities`);
        const oppJson = await oppRes.json();

        if (oppJson.success && oppJson.data) {
          setOpportunities(oppJson.data.opportunities || []);
          setUsers(oppJson.data.users || []);
          setPipelines(oppJson.data.pipelines || []);
        }

        // Fetch contacts
        const contactRes = await fetch(`/api/ghl/test-sdk?locationId=${locationId}&token=${token}&limit=${limit}&type=contacts`);
        const contactJson = await contactRes.json();

        if (contactJson.success && contactJson.data) {
          setContacts(contactJson.data.contacts || []);
        }

        // Fetch custom fields schema
        const cfRes = await fetch(`/api/ghl/test-sdk?locationId=${locationId}&token=${token}&type=custom-fields`);
        const cfJson = await cfRes.json();
        if (cfJson.success && cfJson.data) {
          setCustomFields(cfJson.data.customFields || []);
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [searchParams]);

  if (loading) return <div className="p-8 text-center">Loading data...</div>;
  if (error) return <div className="p-8 text-red-500 text-center">Error: {error}</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">GHL Test Table</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setView('contacts')}
            className={`px-4 py-2 rounded ${view === 'contacts' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Contacts ({contacts.length})
          </button>
          <button 
            onClick={() => setView('opportunities')}
            className={`px-4 py-2 rounded ${view === 'opportunities' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Opportunities ({opportunities.length})
          </button>
        </div>
      </div>

      {view === 'opportunities' ? (
        <GhlOpportunitiesTable
          opportunities={opportunities}
          customFieldsSchema={customFields}
          users={users}
          pipelines={pipelines}
        />
      ) : (
        <GhlContactsTable 
          contacts={contacts} 
          customFieldsSchema={customFields}
        />
      )}
      
      <div className="mt-4 text-gray-500 text-sm">
        Showing {view === 'opportunities' ? opportunities.length : contacts.length} {view}
      </div>
    </div>
  );
}
