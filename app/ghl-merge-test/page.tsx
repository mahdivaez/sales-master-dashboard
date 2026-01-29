'use client';

import { useState } from 'react';
import { getUnifiedUserData } from '@/app/actions';

export default function GhlMergeTestPage() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testMerge = async () => {
    setLoading(true);
    setError(null);
    try {
      const ghlToken = localStorage.getItem('ghl_access_token') || undefined;
      const ghlLocationId = localStorage.getItem('ghl_location_id') || undefined;

      const response = await getUnifiedUserData({
        search: email,
        limit: 1,
        ghlToken,
        ghlLocationId
      });

      if (response.success && response.data) {
        setResult(response.data[0] || { message: 'No user found with this email' });
      } else {
        setError(response.error || 'Failed to fetch');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">GHL + Whop + Sheet Merge Test</h1>
      
      <div className="flex gap-2 mb-8">
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter user email"
          className="flex-1 p-2 border rounded"
        />
        <button 
          onClick={testMerge}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-blue-300"
        >
          {loading ? 'Testing...' : 'Test Merge'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded mb-4">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 rounded">
            <h2 className="font-bold mb-2">Unified Result:</h2>
            <pre className="text-xs overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className={`p-4 rounded border ${result.whopData?.member || result.whopData?.payments?.length ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <h3 className="font-bold">Whop Data</h3>
              <p>{(result.whopData?.member || result.whopData?.payments?.length) ? '✅ Found' : '❌ Not Found'}</p>
            </div>
            <div className={`p-4 rounded border ${result.sheetData?.length ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <h3 className="font-bold">Sheet Data</h3>
              <p>{result.sheetData?.length ? `✅ Found (${result.sheetData.length} records)` : '❌ Not Found'}</p>
            </div>
            <div className={`p-4 rounded border ${result.ghlData ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <h3 className="font-bold">GHL Data</h3>
              <p>{result.ghlData ? '✅ Found' : '❌ Not Found'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
