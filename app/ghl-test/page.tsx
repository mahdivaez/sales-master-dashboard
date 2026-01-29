'use client';

import { useState } from 'react';
import { getGhlContactByEmail } from '@/app/actions';

export default function GhlTestPage() {
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    setContact(null);

    try {
      const result = await getGhlContactByEmail(email);
      if (result.success) {
        setContact(result.contact);
        if (!result.contact) {
          setError('No contact found with this email.');
        }
      } else {
        setError(result.error || 'Failed to fetch contact');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">GHL Contact Test Page</h1>
      
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="font-medium">Enter Email Address:</label>
          <div className="flex gap-2">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="flex-1 p-2 border rounded text-black"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {contact && (
        <div className="bg-white shadow rounded-lg p-6 border">
          <h2 className="text-xl font-semibold mb-4">Contact Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">First Name</p>
              <p className="font-medium">{contact.firstName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Name</p>
              <p className="font-medium">{contact.lastName || 'N/A'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{contact.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{contact.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ID</p>
              <p className="font-mono text-xs">{contact.id}</p>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Raw Data</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-64 text-xs text-black">
              {JSON.stringify(contact, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
