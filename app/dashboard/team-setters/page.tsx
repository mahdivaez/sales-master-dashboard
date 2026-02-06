'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  TrendingUp,
  DollarSign,
  Target,
  Search,
  ChevronRight,
  ArrowUpRight,
  Phone,
  BarChart3
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  stats: {
    closerCount: number;
    closerAmount: number;
    setterCount: number;
    setterAmount: number;
    totalRevenue: number;
  };
}

export default function TeamSettersPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/team?role=setter');
      const data = await response.json();
      // Check if data is an array (valid response) or an error object
      if (Array.isArray(data)) {
        setMembers(data);
      } else {
        setMembers([]);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort by setter amount
  const filteredMembers = members
    .filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.stats.setterAmount - a.stats.setterAmount);

  const totalSetters = members.length;
  const totalSetterRevenue = members.reduce((sum, m) => sum + m.stats.setterAmount, 0);
  const totalSetterCount = members.reduce((sum, m) => sum + m.stats.setterCount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-cyan-100 p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg shadow-green-500/25 border-2 border-green-400/30">
                <Phone className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Team Setters</h1>
                <p className="text-sm font-semibold text-green-600 uppercase tracking-wider">Performance Rankings</p>
              </div>
            </div>
            <p className="text-gray-500 font-medium ml-14">Track setter performance and revenue</p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-md hover:shadow-lg"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link 
              href="/dashboard/team-closers"
              className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-md hover:shadow-lg"
            >
              <Users className="w-4 h-4" />
              Closers
            </Link>
            <Link 
              href="/dashboard/team-management"
              className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-md hover:shadow-lg"
            >
              <UserPlus className="w-4 h-4" />
              Team Mgmt
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-green-500 text-sm font-bold flex items-center gap-1">
                <ArrowUpRight className="w-4 h-4" /> Active
              </span>
            </div>
            <p className="text-3xl font-black text-gray-900">{totalSetters}</p>
            <p className="text-gray-500 font-medium">Total Setters</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-green-500 text-sm font-bold flex items-center gap-1">
                <TrendingUp className="w-4 h-4" /> Revenue
              </span>
            </div>
            <p className="text-3xl font-black text-gray-900">${totalSetterRevenue.toLocaleString()}</p>
            <p className="text-gray-500 font-medium">Total Revenue</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-blue-500 text-sm font-bold flex items-center gap-1">
                <BarChart3 className="w-4 h-4" /> Leads
              </span>
            </div>
            <p className="text-3xl font-black text-gray-900">{totalSetterCount}</p>
            <p className="text-gray-500 font-medium">Total Leads Set</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search setters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-200 outline-none transition-all font-medium shadow-md"
            />
          </div>
        </div>

        {/* Rankings Table */}
        <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rank</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Setter</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Leads Set</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Revenue</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Avg Deal</th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-10 h-10 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin mb-4" />
                        <p className="text-gray-500 font-medium">Loading setters...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <p className="text-gray-500 font-medium">No setters found</p>
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member, index) => (
                    <tr key={member.id} className="hover:bg-green-50/30 transition-colors">
                      <td className="px-6 py-5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                          index === 0 ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white' :
                          index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                          index === 2 ? 'bg-gradient-to-br from-green-700 to-green-800 text-white' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center text-white font-bold">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{member.name}</p>
                            <p className="text-xs text-gray-500">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="font-bold text-gray-900">{member.stats.setterCount}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="font-black text-green-600">${member.stats.setterAmount.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="font-bold text-gray-600">
                          ${member.stats.setterCount > 0 ? Math.round(member.stats.setterAmount / member.stats.setterCount).toLocaleString() : 0}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <Link
                          href={`/dashboard/team/${member.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg font-bold text-sm hover:bg-green-200 transition-colors"
                        >
                          View Details
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-gray-400 font-medium">
            Powered by <span className="font-bold text-cyan-600">Triton</span> Analytics
          </p>
        </div>
      </div>
    </div>
  );
}