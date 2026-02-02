'use client';

import { useState, useEffect } from 'react';
import { getUnifiedUserData } from '@/app/actions';
import { Loader2, AlertCircle, Database, CreditCard, Users } from 'lucide-react';

export default function WhopTestPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    withWhopData: 0,
    totalPayments: 0,
    totalMemberships: 0
  });

  useEffect(() => {
    async function testFetch() {
      try {
        setLoading(true);
        const result = await getUnifiedUserData({ limit: 100 });
        
        if (result.success) {
          const users = result.data || [];
          setData(users);
          
          const whopUsers = users.filter((u: any) => u.source.includes('Whop'));
          const payments = whopUsers.reduce((sum: number, u: any) => sum + (u.whopData?.payments?.length || 0), 0);
          const memberships = whopUsers.reduce((sum: number, u: any) => sum + (u.whopData?.memberships?.length || 0), 0);
          
          setStats({
            totalUsers: users.length,
            withWhopData: whopUsers.length,
            totalPayments: payments,
            totalMemberships: memberships
          });
        } else {
          setError(result.error || 'Failed to fetch');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    testFetch();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Whop Data Integration Test</h1>
      
      {loading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="animate-spin" />
          <span>Fetching data from Whop...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle />
          <span>{error}</span>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Users size={16} />
                <span className="text-sm font-medium">Total Users</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 text-indigo-500 mb-2">
                <Database size={16} />
                <span className="text-sm font-medium">Whop Users</span>
              </div>
              <p className="text-2xl font-bold">{stats.withWhopData}</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 text-emerald-500 mb-2">
                <CreditCard size={16} />
                <span className="text-sm font-medium">Total Payments</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalPayments}</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 text-blue-500 mb-2">
                <Users size={16} />
                <span className="text-sm font-medium">Total Memberships</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalMemberships}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-sm font-bold text-gray-600">Name</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-600">Email</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-600">Whop ID</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-600">Payments</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-600">Memberships</th>
                  <th className="px-6 py-4 text-sm font-bold text-gray-600">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.filter(u => u.source.includes('Whop')).slice(0, 20).map((user, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 text-sm">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 text-sm font-mono text-xs">{user.whopId || '-'}</td>
                    <td className="px-6 py-4 text-sm">{user.whopData?.payments?.length || 0}</td>
                    <td className="px-6 py-4 text-sm">{user.whopData?.memberships?.length || 0}</td>
                    <td className="px-6 py-4 text-sm font-bold">${user.totalSpentWhop.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {stats.withWhopData > 20 && (
              <div className="p-4 text-center text-gray-400 text-sm border-t border-gray-50">
                Showing first 20 Whop users...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
