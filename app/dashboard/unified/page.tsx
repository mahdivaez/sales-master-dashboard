'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  RefreshCw,
  FileText,
  ArrowLeft,
  Database,
  Sheet,
  CreditCard,
  ExternalLink,
  Zap,
  UserPlus
} from 'lucide-react';
import { UnifiedUserTable } from '@/components/UnifiedUserTable';

interface UnifiedUser {
  email: string;
  name?: string;
  username?: string;
  whopId?: string;
  totalSpentWhop: number;
  totalSpentSheet: number;
  totalSpentElective: number;
  totalSpentFanbasis: number;
  lastPaymentDate?: string;
  companies?: string[];
  whopData: {
    payments: any[];
    memberships: any[];
  };
  sheetData: any[];
  electiveData?: any[];
  fanbasisData?: any[];
  ghlData?: {
    id: string;
    contact?: {
      phone?: string;
      tags?: string[];
      dateAdded?: string;
    };
    opportunities?: any[];
    appointments?: any[];
    ghlUsers?: any[];
  };
  pipelineData?: any[];
}

export default function UnifiedPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UnifiedUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/unified');
      const result = await response.json();
      
      if (result.error) {
        setError(result.error);
        setUsers([]);
      } else if (result.users && Array.isArray(result.users)) {
        setUsers(result.users);
      } else if (Array.isArray(result)) {
        setUsers(result);
      } else {
        setUsers([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Calculate stats
  const totalRevenue = users.reduce((sum, u) => 
    sum + u.totalSpentWhop + u.totalSpentSheet + (u.totalSpentElective || 0) + (u.totalSpentFanbasis || 0), 0);
  const totalWhop = users.reduce((sum, u) => sum + u.totalSpentWhop, 0);
  const totalSheet = users.reduce((sum, u) => sum + u.totalSpentSheet, 0);
  const totalElective = users.reduce((sum, u) => sum + (u.totalSpentElective || 0), 0);
  const totalFanbasis = users.reduce((sum, u) => sum + (u.totalSpentFanbasis || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-cyan-100 p-8">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link 
                href="/dashboard"
                className="p-2 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg shadow-blue-500/25 border-2 border-blue-400/30">
                <Database className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Unified Database</h1>
                <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">All Sources Combined</p>
              </div>
            </div>
            <p className="text-gray-500 font-medium ml-14">Combined data from AI CEOS, Google Sheets, Elective, Fanbasis, and GHL</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/team"
              className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-md"
            >
              <UserPlus className="w-4 h-4" />
              Team
            </Link>
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-800 transition-all shadow-lg shadow-blue-500/25 border-2 border-blue-400/30 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-gray-400" />
              <p className="text-xs font-bold text-gray-400 uppercase">Users</p>
            </div>
            <p className="text-2xl font-black text-gray-900">{users.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border-2 border-indigo-200 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-indigo-500" />
              <p className="text-xs font-bold text-indigo-400 uppercase">AI CEOS</p>
            </div>
            <p className="text-2xl font-black text-gray-900">${totalWhop.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border-2 border-emerald-200 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Sheet className="w-4 h-4 text-emerald-500" />
              <p className="text-xs font-bold text-emerald-400 uppercase">Sheet</p>
            </div>
            <p className="text-2xl font-black text-gray-900">${totalSheet.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border-2 border-purple-200 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-purple-500" />
              <p className="text-xs font-bold text-purple-400 uppercase">Elective</p>
            </div>
            <p className="text-2xl font-black text-gray-900">${totalElective.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border-2 border-cyan-200 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <ExternalLink className="w-4 h-4 text-cyan-500" />
              <p className="text-xs font-bold text-cyan-400 uppercase">Fanbasis</p>
            </div>
            <p className="text-2xl font-black text-gray-900">${totalFanbasis.toLocaleString()}</p>
          </div>
        </div>

        {/* Total Revenue Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-4 mb-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/80">Total Combined Revenue</p>
                <p className="text-3xl font-black text-white">${totalRevenue.toLocaleString()}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-white/80">Users with Activity</p>
              <p className="text-2xl font-black text-white">{users.filter(u => u.totalSpentWhop > 0 || u.totalSpentSheet > 0 || u.totalSpentElective > 0 || u.totalSpentFanbasis > 0).length}</p>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700 font-medium">Error: {error}</p>
            <button
              onClick={fetchUsers}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Main Table */}
        {!loading && !error && (
          <UnifiedUserTable users={users} />
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-200 p-12 text-center">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Loading unified database...</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-gray-400 font-medium">
            Powered by <span className="font-bold text-blue-600">Triton</span> Analytics
          </p>
        </div>
      </div>
    </div>
  );
}