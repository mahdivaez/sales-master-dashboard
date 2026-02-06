'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { FanbasisUpload } from '@/components/FanbasisUpload';

export default function SyncPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSync = async (type: string) => {
    setLoading(type);
    setResult(null);
    try {
      const response = await fetch(`/api/sync?type=${type}`, { method: 'POST' });
      const data = await response.json();
      if (response.ok) {
        setResult({ success: true, message: `${type.toUpperCase()} synchronized successfully!` });
      } else {
        setResult({ success: false, message: data.error || 'Synchronization failed.' });
      }
    } catch (error) {
      setResult({ success: false, message: 'An error occurred during synchronization.' });
    } finally {
      setLoading(null);
    }
  };

  const handleElectiveUpload = (event: React.ChangeEvent<HTMLInputElement>, companyId: string, companyName: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(`elective-${companyId}`);
    setResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        if (results.errors.length > 0) {
          setResult({ success: false, message: `Error parsing CSV for ${companyName}.` });
          setLoading(null);
          return;
        }

        const mappedData = results.data.map((row: any) => ({
          saleDate: row['Sale Date'],
          customerEmail: row['Email']?.toLowerCase().trim(),
          customerName: row['Customer'],
          netAmount: parseFloat(row['Net Amount']?.replace(/[^0-9.-]+/g, '')) || 0,
        })).filter(item => item.customerEmail);

        try {
          const response = await fetch('/api/elective/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: mappedData, companyId })
          });

          if (response.ok) {
            setResult({ success: true, message: `Elective data for ${companyName} saved successfully!` });
          } else {
            const errData = await response.json();
            setResult({ success: false, message: errData.error || `Failed to save ${companyName} data.` });
          }
        } catch (err) {
          setResult({ success: false, message: `An error occurred saving ${companyName} data.` });
        } finally {
          setLoading(null);
        }
      },
      error: (err) => {
        setResult({ success: false, message: `Error: ${err.message}` });
        setLoading(null);
      }
    });
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '2rem', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Database Synchronization</h1>
        <p style={{ color: '#666', marginBottom: '2rem' }}>
          Choose which data source you want to synchronize with the database.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* API Syncs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#333' }}>API Sources</h2>
            
            <button 
              onClick={() => handleSync('whop')} 
              disabled={!!loading} 
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                backgroundColor: loading === 'whop' ? '#ccc' : '#0070f3', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              {loading === 'whop' ? 'Syncing Whop...' : 'Sync Whop'}
            </button>

            <button 
              onClick={() => handleSync('ghl')} 
              disabled={!!loading} 
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                backgroundColor: loading === 'ghl' ? '#ccc' : '#f97316', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              {loading === 'ghl' ? 'Syncing GHL...' : 'Sync GHL'}
            </button>

            <button 
              onClick={() => handleSync('sheets')} 
              disabled={!!loading} 
              style={{ 
                width: '100%', 
                padding: '0.75rem', 
                backgroundColor: loading === 'sheets' ? '#ccc' : '#10b981', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              {loading === 'sheets' ? 'Syncing Google Sheets...' : 'Sync Google Sheets'}
            </button>
          </div>

          {/* CSV Uploads */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#333' }}>CSV Sources (Elective)</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>HCEO Elective CSV</label>
              <input 
                type="file" 
                accept=".csv" 
                onChange={(e) => handleElectiveUpload(e, 'hceo', 'HCEO')}
                disabled={!!loading}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>KCEO Elective CSV</label>
              <input 
                type="file" 
                accept=".csv" 
                onChange={(e) => handleElectiveUpload(e, 'kceo', 'KCEO')}
                disabled={!!loading}
              />
            </div>
          </div>

          {/* CSV Uploads Fanbasis - Single file for both KCEO and HCEO */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#333' }}>CSV Sources (Fanbasis)</h2>
            <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>
              Upload a single file with fanbasis transactions. Transactions will be linked to existing users by email.
            </p>
            <FanbasisUpload companyId="hceo" companyName="Fanbasis" onDataLoaded={() => {}} />
          </div>

          <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '0.5rem 0' }} />

          <button 
            onClick={() => handleSync('all')} 
            disabled={!!loading} 
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              backgroundColor: loading === 'all' ? '#ccc' : '#6366f1', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold'
            }}
          >
            {loading === 'all' ? 'Syncing Everything...' : 'Sync All API Data'}
          </button>
        </div>

        {result && (
          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1rem', 
            borderRadius: '4px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            backgroundColor: result.success ? '#f0fff4' : '#fff5f5',
            color: result.success ? '#22543d' : '#822727',
            border: `1px solid ${result.success ? '#c6f6d5' : '#fed7d7'}`
          }}>
            <span>{result.success ? '✅' : '❌'}</span>
            <span>{result.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
