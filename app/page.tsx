'use client';

import { useState, useEffect } from 'react';
import { getUnifiedUserData } from './actions';
import { UnifiedUserTable } from '@/components/UnifiedUserTable';
import { Loader2, AlertCircle, RefreshCw, Search, LayoutDashboard } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from '@/components/DateRangePicker';
import Link from 'next/link';

export default function UnifiedDatabasePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const fetchData = async (currentPage = 1, search = '') => {
    if (currentPage === 1) setLoading(true);
    setError(null);
    try {
      const limit = 50;
      const offset = (currentPage - 1) * limit;
      
      // Default to last 12 months if no search to speed up initial load
      const startDate = dateRange?.from ? dateRange.from.toISOString() : (search ? undefined : new Date(new Date().setMonth(new Date().getMonth() - 12)).toISOString());
      const endDate = dateRange?.to ? dateRange.to.toISOString() : undefined;

      const ghlToken = typeof window !== 'undefined' ? localStorage.getItem('ghl_access_token') || undefined : undefined;
      const ghlLocationId = typeof window !== 'undefined' ? localStorage.getItem('ghl_location_id') || undefined : undefined;

      const result = await getUnifiedUserData({
        limit,
        offset,
        search,
        startDate,
        endDate,
        ghlToken,
        ghlLocationId
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
  };

  useEffect(() => {
    fetchData(1, searchTerm);
    setIsInitialLoad(false);
  }, [searchTerm, dateRange, fetchData]);

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
            <p className="text-gray-500 font-medium">Cross-referencing AI CEOS members with Google Sheets records</p>
          </div>
          <div className="flex items-center gap-4">
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
              Refresh Data
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl shadow-xl border border-gray-100">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500 font-bold animate-pulse">Merging data sources...</p>
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
