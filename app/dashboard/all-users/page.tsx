'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  RefreshCw,
  FileText,
  ArrowLeft,
  Search,
  Filter,
  Download
} from 'lucide-react';
import { UnifiedTable } from '@/components/UnifiedTable';
import { UnifiedUser } from '@/types';

export default function AllUsersPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UnifiedUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users');
      const result = await response.json();
      
      if (result.users && Array.isArray(result.users)) {
        setUsers(result.users);
      } else if (Array.isArray(result)) {
        setUsers(result);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (user.name && user.name.toLowerCase().includes(searchLower)) ||
      (user.email && user.email.toLowerCase().includes(searchLower)) ||
      (user.username && user.username.toLowerCase().includes(searchLower))
    );
  });

  const handleExport = () => {
    const exportData = filteredUsers.map(user => ({
      name: user.name || user.username,
      email: user.email,
      totalSpent: user.totalSpent,
      memberships: user.memberships.length,
      payments: user.payments.length,
      lastPaymentDate: user.payments[0] ? new Date(user.payments[0].created_at).toISOString() : null,
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/25 border-2 border-indigo-400/30">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">All Users</h1>
                <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Complete User Database</p>
              </div>
            </div>
            <p className="text-gray-500 font-medium ml-14">View all users with memberships, payments, and revenue</p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/unified-database"
              className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-md hover:shadow-lg"
            >
              <FileText className="w-4 h-4" />
              Sheet Data
            </Link>
            <button
              onClick={handleExport}
              disabled={loading || users.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => fetchUsers()}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25 border-2 border-indigo-400/30 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-200 outline-none transition-all font-medium shadow-md"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-md">
            <p className="text-2xl font-black text-gray-900">{users.length}</p>
            <p className="text-sm text-gray-500 font-medium">Total Users</p>
          </div>
          <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-md">
            <p className="text-2xl font-black text-gray-900">
              ${users.reduce((sum, u) => sum + u.totalSpent, 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
          </div>
          <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-md">
            <p className="text-2xl font-black text-gray-900">
              {users.reduce((sum, u) => sum + u.memberships.length, 0)}
            </p>
            <p className="text-sm text-gray-500 font-medium">Total Memberships</p>
          </div>
          <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-md">
            <p className="text-2xl font-black text-gray-900">
              {users.reduce((sum, u) => sum + u.payments.length, 0)}
            </p>
            <p className="text-sm text-gray-500 font-medium">Total Payments</p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No users found</p>
            </div>
          ) : (
            <UnifiedTable users={filteredUsers} />
          )}
        </div>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-gray-400 font-medium">
            Powered by <span className="font-bold text-indigo-600">Triton</span> Analytics
          </p>
        </div>
      </div>
    </div>
  );
}