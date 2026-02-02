'use client';

import { useState, useEffect, useCallback } from 'react';
import { getUnifiedUserData } from './actions';
import { UnifiedUserTable } from '@/components/UnifiedUserTable';
import { ElectiveUpload } from '@/components/ElectiveUpload';
import { Loader2, AlertCircle, RefreshCw, Search, LayoutDashboard, Upload, Building2 } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from '@/components/DateRangePicker';
import { COMPANIES } from '@/lib/config';

export default function UnifiedDatabasePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [electiveData, setElectiveData] = useState<Record<string, any[]>>({});
  const [hasUploadedCsv, setHasUploadedCsv] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');

  const fetchData = useCallback(async (currentPage = 1, search = '', currentElectiveDataMap = electiveData, companyId = selectedCompanyId) => {
    // Check if we have any elective data at all
    const hasAnyElectiveData = Object.values(currentElectiveDataMap).some(data => data.length > 0);
    if (!hasUploadedCsv && !hasAnyElectiveData) return;
    
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

      // Flatten elective data for the action, but we could also filter it here
      let flattenedElectiveData: any[] = [];
      if (companyId === 'all') {
        flattenedElectiveData = Object.values(currentElectiveDataMap).flat();
      } else {
        flattenedElectiveData = currentElectiveDataMap[companyId] || [];
      }

      const result = await getUnifiedUserData({
        limit,
        offset,
        search,
        startDate,
        endDate,
        ghlToken,
        ghlLocationId,
        electiveData: flattenedElectiveData,
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
    if (hasUploadedCsv) {
      fetchData(1, searchTerm, electiveData, selectedCompanyId);
    }
    if (isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [searchTerm, dateRange, fetchData, isInitialLoad, hasUploadedCsv, selectedCompanyId]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchData(nextPage, searchTerm, electiveData);
  };

  const handleElectiveDataLoaded = (data: any[], companyId: string) => {
    setElectiveData(prev => {
      const newData = { ...prev, [companyId]: data };
      // Check if we have any data now
      const hasAnyData = Object.values(newData).some(d => d.length > 0);
      setHasUploadedCsv(hasAnyData);
      return newData;
    });
    setPage(1);
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
              Refresh Data
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {COMPANIES.map(company => (
            <ElectiveUpload 
              key={company.id}
              companyName={company.name}
              onDataLoaded={(data) => handleElectiveDataLoaded(data, company.id)} 
            />
          ))}
        </div>

        {!hasUploadedCsv ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl shadow-xl border border-gray-100">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <Upload className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Waiting for CSV Upload</h3>
            <p className="text-gray-500 font-medium max-w-md text-center">
              Please upload your Elective CSV file above to start fetching and merging data from other sources.
            </p>
          </div>
        ) : loading && users.length === 0 ? (
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
