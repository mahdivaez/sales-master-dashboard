'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GhlSetupPage() {
  const router = useRouter();

  useEffect(() => {
    const cookies = document.cookie.split('; ');
    const tempDataCookie = cookies.find(row => row.startsWith('ghl_temp_data='));
    
    if (tempDataCookie) {
      try {
        const data = JSON.parse(decodeURIComponent(tempDataCookie.split('=')[1]));
        
        if (data.access_token) {
          localStorage.setItem('ghl_access_token', data.access_token);
          localStorage.setItem('ghl_refresh_token', data.refresh_token);
          localStorage.setItem('ghl_location_id', data.locationId);
          
          // Clear the temp cookie
          document.cookie = "ghl_temp_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          
          router.push('/ghl-dashboard');
        }
      } catch (e) {
        console.error('Failed to parse GHL data', e);
      }
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Completing GHL Connection...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  );
}
