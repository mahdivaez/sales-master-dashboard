'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Target, 
  ArrowLeft,
  RefreshCw,
  ChevronRight,
  Search,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface TeamMemberReport {
  id: string;
  name: string;
  email: string;
  totalRevenue: number;
  salesCount: number;
  breakdown: {
    sheet: number;
    elective: number;
    fanbasis: number;
  };
}

export default function TeamReportsPage() {
  const [type, setType] = useState<'closer' | 'setter'>('closer');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<TeamMemberReport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/team-reports?type=${type}`);
      const data = await response.json();
      if (data.report) {
        setReportData(data.report);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const filteredData = reportData.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.email && m.email.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => b.totalRevenue - a.totalRevenue);

  const totalRevenue = filteredData.reduce((sum, m) => sum + m.totalRevenue, 0);
  const totalSales = filteredData.reduce((sum, m) => sum + m.salesCount, 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/reports" className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg">
                <Users className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Team Performance</h1>
                <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Closers & Setters Analytics</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
              <button
                onClick={() => setType('closer')}
                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${type === 'closer' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                Closers
              </button>
              <button
                onClick={() => setType('setter')}
                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${type === 'setter' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                Setters
              </button>
            </div>
            <button
              onClick={fetchReport}
              className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm font-bold text-gray-500 uppercase">Total Revenue</p>
            </div>
            <p className="text-3xl font-black text-gray-900">${totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm font-bold text-gray-500 uppercase">Total Sales</p>
            </div>
            <p className="text-3xl font-black text-gray-900">{totalSales.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-sm font-bold text-gray-500 uppercase">Avg. Sale Value</p>
            </div>
            <p className="text-3xl font-black text-gray-900">
              ${totalSales > 0 ? (totalRevenue / totalSales).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0}
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm mb-8">
          <h3 className="text-xl font-black text-gray-900 mb-6">Revenue by {type === 'closer' ? 'Closer' : 'Setter'}</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredData.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontWeight: 600, fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748B', fontWeight: 600, fontSize: 12 }}
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip 
                  cursor={{ fill: '#F8FAFC' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as TeamMemberReport;
                      return (
                        <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-100">
                          <p className="font-black text-gray-900 mb-2">{data.name}</p>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-500 flex justify-between gap-4">
                              Revenue: <span className="font-bold text-gray-900">${data.totalRevenue.toLocaleString()}</span>
                            </p>
                            <p className="text-sm text-gray-500 flex justify-between gap-4">
                              Sales: <span className="font-bold text-gray-900">{data.salesCount}</span>
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="totalRevenue" radius={[6, 6, 0, 0]} barSize={40}>
                  {filteredData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#2563EB' : '#94A3B8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-xl font-black text-gray-900">Performance Ranking</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm font-medium w-full md:w-64 focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Rank</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Member</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Revenue</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Sales</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Avg. Sale</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredData.map((member, index) => (
                  <tr key={member.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-100 text-gray-700' : index === 2 ? 'bg-orange-100 text-orange-700' : 'text-gray-400'}`}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-gray-900">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.email || 'No email'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-gray-900">${member.totalRevenue.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-bold text-gray-600">{member.salesCount}</td>
                    <td className="px-6 py-4 text-right font-bold text-blue-600">
                      ${member.salesCount > 0 ? (member.totalRevenue / member.salesCount).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/reports/team/${type}/${member.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black hover:bg-blue-600 hover:text-white transition-all"
                      >
                        View Details
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
