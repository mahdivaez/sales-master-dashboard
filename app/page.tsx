'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUnifiedUserData } from './actions';
import { UnifiedUserTable } from '@/components/UnifiedUserTable';
import { Loader2, AlertCircle, RefreshCw, Search, LayoutDashboard, Building2, Database } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from '@/components/DateRangePicker';
import { COMPANIES } from '@/lib/config';
import Link from 'next/link';

export default function UnifiedDatabasePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');

  const fetchData = useCallback(async (currentPage = 1, search = '', companyId = selectedCompanyId) => {
    if (currentPage === 1) setLoading(true);
    setError(null);
    try {
      const limit = 50;
      const offset = (currentPage - 1) * limit;
      
      const startDate = dateRange?.from ? dateRange.from.toISOString() : undefined;
      const endDate = dateRange?.to ? dateRange.to.toISOString() : undefined;

      const result = await getUnifiedUserData({
        limit,
        offset,
        search,
        startDate,
        endDate,
        companyId: companyId === 'all' ? undefined : companyId
      });

      if (result.success) {
        if (currentPage === 1) {
          setUsers(result.data || []);
        } else {
          setUsers(prev => [...prev, ...(result.data || [])]);
        }
        setTotalCount(result.totalCount || 0);
        setHasMore(result.hasMore || false);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [dateRange, selectedCompanyId]);

  useEffect(() => {
    fetchData(1, searchTerm, selectedCompanyId);
  }, [searchTerm, dateRange, fetchData, selectedCompanyId]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchData(nextPage, searchTerm);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 bg-blue-600 rounded-lg">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">Unified Database</h1>
            </div>
            <p className="text-gray-500 font-medium">Data fetched directly from Supabase Database</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sync" className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-sm">
              <Database className="w-4 h-4" />
              Sync Database
            </Link>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
              <Building2 className="w-4 h-4 text-gray-400" />
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-700 outline-none"
              >
                <option value="all">All Companies</option>
                {COMPANIES.map(company => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <DateRangePicker range={dateRange} onRangeChange={setDateRange} />
            <button
              onClick={() => fetchData(1, searchTerm)}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {loading && users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl shadow-xl border border-gray-100">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500 font-bold animate-pulse">Loading from database...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-3xl p-8 flex items-center gap-6">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-red-900 mb-1">Error Loading Data</h3>
              <p className="text-red-700 font-medium">{error}</p>
              <button 
                onClick={() => fetchData(1, searchTerm)}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl shadow-xl border border-gray-100">
            <Database className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900">No data found in database</h3>
            <p className="text-gray-500 mt-2">Please run the synchronization on the Sync page.</p>
            <Link href="/sync" className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold">
              Go to Sync Page
            </Link>
          </div>
        ) : (
          <>
            <UnifiedUserTable users={users} />
            {hasMore && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More Users'}
                </button>
              </div>
            )}
            <div className="mt-4 text-center text-gray-500 font-medium">
              Showing {users.length} of {totalCount} users
            </div>
          </>
        )}
      </div>
    </div>
  );
}
