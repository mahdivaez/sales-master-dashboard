'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  Crown,
  Handshake,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Download,
  AlertCircle
} from 'lucide-react';

interface Closer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  isActive: boolean;
  totalRevenue: number;
  totalSales: number;
}

interface Setter {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  isActive: boolean;
  totalRevenue: number;
  totalSales: number;
}

export default function TeamPage() {
  const [loading, setLoading] = useState(true);
  const [closers, setClosers] = useState<Closer[]>([]);
  const [setters, setSetters] = useState<Setter[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'closers' | 'setters'>('closers');
  const [searchTerm, setSearchTerm] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [closersRes, settersRes] = await Promise.all([
        fetch('/api/closers'),
        fetch('/api/setters'),
      ]);

      const closersData = await closersRes.json();
      const settersData = await settersRes.json();

      if (closersData.error) {
        setError(closersData.error);
      } else {
        setClosers(closersData.closers || []);
      }

      if (settersData.error) {
        setError(settersData.error);
      } else {
        setSetters(settersData.setters || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch team data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const endpoint = activeTab === 'closers' ? '/api/closers' : '/api/setters';
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ...(editingId && { id: editingId }),
        }),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingId(null);
        setFormData({ name: '', email: '', phone: '' });
        fetchTeam();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (member: Closer | Setter) => {
    setEditingId(member.id);
    setFormData({
      name: member.name,
      email: member.email || '',
      phone: member.phone || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this member?')) return;

    try {
      const endpoint = activeTab === 'closers' ? `/api/closers?id=${id}` : `/api/setters?id=${id}`;
      const response = await fetch(endpoint, { method: 'DELETE' });

      if (response.ok) {
        fetchTeam();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
    }
  };

  const handleToggleActive = async (member: Closer | Setter) => {
    try {
      const endpoint = activeTab === 'closers' ? '/api/closers' : '/api/setters';
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: member.id,
          isActive: !member.isActive,
        }),
      });

      if (response.ok) {
        fetchTeam();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update status');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handleSyncFromSheet = async () => {
    setSyncing(true);
    setSyncResult(null);
    setError(null);

    try {
      const companyId = 'default-company';
      
      const response = await fetch('/api/sync/closers-setters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      });

      const data = await response.json();

      if (response.ok) {
        setSyncResult(data.summary);
        fetchTeam();
      } else {
        setError(data.error || 'Failed to sync from sheet');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sync from sheet');
    } finally {
      setSyncing(false);
    }
  };

  const filteredMembers = activeTab === 'closers'
    ? closers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : setters.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const currentMembers = activeTab === 'closers' ? closers : setters;
  const totalRevenue = currentMembers.reduce((sum, m) => sum + m.totalRevenue, 0);
  const totalSales = currentMembers.reduce((sum, m) => sum + m.totalSales, 0);
  const activeCount = currentMembers.filter(m => m.isActive).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-cyan-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link 
                href="/dashboard/unified"
                className="p-2 bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-lg shadow-indigo-500/25 border-2 border-indigo-400/30">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Team Management</h1>
                <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Closers & Setters</p>
              </div>
            </div>
            <p className="text-gray-500 font-medium ml-14">Manage your sales team members and their performance</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSyncFromSheet}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl font-bold hover:from-emerald-700 hover:to-teal-800 transition-all shadow-lg shadow-emerald-500/25 border-2 border-emerald-400/30 disabled:opacity-50"
            >
              <Download className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync from Sheet'}
            </button>
            <button
              onClick={fetchTeam}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-xl font-bold hover:from-indigo-700 hover:to-purple-800 transition-all shadow-lg shadow-indigo-500/25 border-2 border-indigo-400/30 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border-2 border-gray-200 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-gray-400" />
              <p className="text-xs font-bold text-gray-400 uppercase">Total Members</p>
            </div>
            <p className="text-2xl font-black text-gray-900">{currentMembers.length}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border-2 border-emerald-200 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <p className="text-xs font-bold text-emerald-400 uppercase">Active</p>
            </div>
            <p className="text-2xl font-black text-gray-900">{activeCount}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border-2 border-blue-200 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-blue-500" />
              <p className="text-xs font-bold text-blue-400 uppercase">Total Revenue</p>
            </div>
            <p className="text-2xl font-black text-gray-900">${totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border-2 border-purple-200 shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <p className="text-xs font-bold text-purple-400 uppercase">Total Sales</p>
            </div>
            <p className="text-2xl font-black text-gray-900">{totalSales}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setActiveTab('closers'); setShowForm(false); setEditingId(null); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'closers'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Crown className="w-5 h-5" />
            Closers ({closers.length})
          </button>
          <button
            onClick={() => { setActiveTab('setters'); setShowForm(false); setEditingId(null); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'setters'
                ? 'bg-green-600 text-white shadow-lg shadow-green-500/25'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Handshake className="w-5 h-5" />
            Setters ({setters.length})
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700 font-medium">Error: {error}</p>
          </div>
        )}

        {/* Sync Result */}
        {syncResult && (
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 mb-6">
            <p className="text-emerald-700 font-medium mb-2">Sync completed successfully!</p>
            <div className="text-sm text-emerald-600">
              <p>Closers: {syncResult.closersCreated} created, {syncResult.closersUpdated} updated (Total: {syncResult.totalClosers})</p>
              <p>Setters: {syncResult.settersCreated} created, {syncResult.settersUpdated} updated (Total: {syncResult.totalSetters})</p>
            </div>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-xl p-6 mb-6 border-2 border-gray-200 shadow-md">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingId ? `Edit ${activeTab === 'closers' ? 'Closer' : 'Setter'}` : `Add New ${activeTab === 'closers' ? 'Closer' : 'Setter'}`}
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="md:col-span-3 flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); setFormData({ name: '', email: '', phone: '' }); }}
                  className="flex items-center gap-2 px-6 py-2 bg-gray-500 text-white rounded-xl font-bold hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search and Add */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-3 bg-white border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium w-full md:w-80"
            />
          </div>
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setFormData({ name: '', email: '', phone: '' }); }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-800 transition-all shadow-lg shadow-blue-500/25"
          >
            <UserPlus className="w-5 h-5" />
            Add {activeTab === 'closers' ? 'Closer' : 'Setter'}
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Name</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Revenue</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Sales</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs ${
                          activeTab === 'closers' ? 'bg-blue-500' : 'bg-green-500'
                        }`}>
                          {member.name.charAt(0)}
                        </div>
                        <p className="font-bold text-gray-900">{member.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm text-gray-600">{member.email || '-'}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm text-gray-600">{member.phone || '-'}</p>
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-gray-900">
                      ${member.totalRevenue.toLocaleString()}
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-gray-900">
                      {member.totalSales}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        member.isActive 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {member.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(member)}
                          className={`p-2 rounded-lg transition-colors ${
                            member.isActive 
                              ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                              : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                          }`}
                          title={member.isActive ? 'Deactivate' : 'Activate'}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(member)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(member.id)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredMembers.length === 0 && !loading && (
            <div className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No {activeTab} found</p>
            </div>
          )}

          {loading && (
            <div className="p-12 text-center">
              <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Loading...</p>
            </div>
          )}
        </div>

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