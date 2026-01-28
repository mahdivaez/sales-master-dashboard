'use client';

import { useEffect, useState } from 'react';
import { DashboardData } from '@/types';
import { DashboardStats } from '@/components/DashboardStats';
import { RevenueChart } from '@/components/RevenueChart';
import { UnifiedTable } from '@/components/UnifiedTable';
import { DetailedUserTable } from '@/components/DetailedUserTable';
import { UserProfileModal } from '@/components/UserProfileModal';
import { DateRangePicker } from '@/components/DateRangePicker';
import CashCollectedTable from '@/components/CashCollectedTable';
import { RefreshCw, LayoutDashboard, Search, Table as TableIcon, List, Download, Database } from 'lucide-react';
import { UnifiedUser } from '@/types';
import { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';
import Link from 'next/link';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'unified' | 'detailed'>('unified');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UnifiedUser | null>(null);
  const [companyId, setCompanyId] = useState<string>('biz_gwvX72rmmUEqwj');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const companies = [
    { id: 'biz_gwvX72rmmUEqwj', name: 'Company 1' },
    { id: 'biz_qcxyUyVWg1WZ7P', name: 'Company 2' }
  ];

  const exportToCSV = () => {
    if (!filteredUsers.length) return;

    const headers = ['Name', 'Username', 'Email', 'Total Spent', 'Memberships'];
    const rows = filteredUsers.map(user => [
      user.name || 'N/A',
      user.username,
      user.email,
      user.totalSpent.toFixed(2),
      user.memberships.map(m => `${m.product.title} (${m.status})`).join('; ')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `halal-sales-export-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  async function fetchDashboard() {
    setLoading(true);
    try {
      let url = '/api/dashboard';
      const params = new URLSearchParams();
      
      if (dateRange?.from) {
        params.append('from', dateRange.from.toISOString());
        if (dateRange.to) {
          params.append('to', dateRange.to.toISOString());
        }
      }
      
      if (companyId) {
        params.append('company_id', companyId);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      const dashboardData = await res.json();
      setData(dashboardData);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();
  }, [dateRange, companyId]);

  const filteredUsers = data?.users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      user.memberships.some(m => m.status === statusFilter);

    return matchesSearch && matchesStatus;
  }) || [];

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 font-medium animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-blue-600 rounded-lg">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Sales Intelligence</h1>
            </div>
            <p className="text-gray-500 text-sm font-medium">Real-time overview of your AI CEOS ecosystem</p>
          </div>
          
          <div className="flex items-center gap-3">
            <select 
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            >
              {companies.map(company => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
            <DateRangePicker 
              range={dateRange}
              onRangeChange={setDateRange}
            />
            <Link 
              href="/unified-database"
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold text-sm shadow-md"
            >
              <Database className="w-4 h-4" />
              Unified DB
            </Link>
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold text-sm shadow-sm"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button 
              onClick={fetchDashboard}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold text-sm shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center justify-between">
            <p className="text-red-700 text-sm font-medium">{error}</p>
            <button onClick={fetchDashboard} className="text-red-700 underline text-sm font-bold">Try again</button>
          </div>
        )}

        {data && (
          <>
            <DashboardStats 
              totalRevenue={data.totalRevenue}
              totalRevenueBeforeFees={data.totalRevenueBeforeFees}
              activeMemberships={data.activeMemberships}
              totalUsers={data.totalUsers}
              arpu={data.arpu}
            />

            <RevenueChart data={data.revenueTrend} />

            <div className="mt-12">
              <CashCollectedTable />
            </div>

            <div className="mt-12">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">User Directory</h2>
                  <p className="text-sm text-gray-500 font-medium">Sorted by most recent activity</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="trialing">Trialing</option>
                    <option value="past_due">Past Due</option>
                    <option value="completed">Completed</option>
                  </select>

                  <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
                    <button 
                      onClick={() => setViewMode('unified')}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'unified' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      <List className="w-3.5 h-3.5" />
                      Unified
                    </button>
                    <button 
                      onClick={() => setViewMode('detailed')}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'detailed' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      <TableIcon className="w-3.5 h-3.5" />
                      Detailed
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-full md:w-64 shadow-sm"
                    />
                  </div>
                </div>
              </div>
              
              {viewMode === 'unified' ? (
                <UnifiedTable users={filteredUsers} onUserClick={setSelectedUser} />
              ) : (
                <DetailedUserTable users={filteredUsers} />
              )}
              
              {filteredUsers.length === 0 && (
                <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
                  <p className="text-gray-500 font-medium">No users found matching your search.</p>
                </div>
              )}
            </div>

            {selectedUser && (
              <UserProfileModal 
                user={selectedUser} 
                onClose={() => setSelectedUser(null)} 
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}
