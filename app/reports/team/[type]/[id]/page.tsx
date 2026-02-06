'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeft, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Calendar,
  RefreshCw,
  Mail,
  Phone,
  Briefcase,
  Sheet,
  CreditCard,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function TeamMemberDetailPage() {
  const params = useParams();
  const type = params.type as string; // 'closer' or 'setter'
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<any>(null);

  const fetchMemberData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/team-reports?type=${type}&id=${id}`);
      const data = await response.json();
      if (data.member) {
        setMember(data.member);
      }
    } catch (error) {
      console.error('Error fetching member data:', error);
    } finally {
      setLoading(false);
    }
  }, [type, id]);

  useEffect(() => {
    fetchMemberData();
  }, [fetchMemberData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <p className="text-xl font-bold text-gray-900 mb-4">Member not found</p>
        <Link href="/reports/team" className="text-blue-600 font-bold hover:underline">Back to Team Reports</Link>
      </div>
    );
  }

  const sheetRev = member.sheetData.reduce((sum: number, s: any) => sum + (s.amount || 0), 0);
  const electiveRev = member.electiveData.reduce((sum: number, e: any) => sum + (e.netAmount || 0), 0);
  const fanbasisRev = member.fanbasisData.reduce((sum: number, f: any) => sum + (f.netAmount || 0), 0);
  const totalRevenue = sheetRev + electiveRev + fanbasisRev;
  const totalSales = member.sheetData.length + member.electiveData.length + member.fanbasisData.length;

  const sourceData = [
    { name: 'Sheet', value: sheetRev, color: '#6366f1' },
    { name: 'Elective', value: electiveRev, color: '#f59e0b' },
    { name: 'Fanbasis', value: fanbasisRev, color: '#ec4899' },
  ].filter(d => d.value > 0);

  // Combine all sales for the table
  const allSales = [
    ...member.sheetData.map((s: any) => ({ ...s, source: 'Sheet', amount: s.amount, date: s.date })),
    ...member.electiveData.map((e: any) => ({ ...e, source: 'Elective', amount: e.netAmount, date: e.saleDate, contactEmail: e.customerEmail, contactName: e.customerName })),
    ...member.fanbasisData.map((f: any) => ({ ...f, source: 'Fanbasis', amount: f.netAmount, date: f.date, contactEmail: f.customerEmail, contactName: f.customerName })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div className="flex items-center gap-4">
            <Link href="/reports/team" className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg">
              {member.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">{member.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-black uppercase tracking-wider">
                  {type}
                </span>
                <span className="text-sm text-gray-500 font-medium flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {member.email || 'No email'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={fetchMemberData}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Total Revenue</p>
            <p className="text-3xl font-black text-gray-900">${totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Total Sales</p>
            <p className="text-3xl font-black text-gray-900">{totalSales}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Avg. Sale Value</p>
            <p className="text-3xl font-black text-gray-900">
              ${totalSales > 0 ? (totalRevenue / totalSales).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0}
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Active Since</p>
            <p className="text-xl font-black text-gray-900">{new Date(member.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Revenue Source Breakdown */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-black text-gray-900 mb-6">Revenue Sources</h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-4">
              {sourceData.map((source) => (
                <div key={source.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }} />
                    <span className="text-sm font-bold text-gray-600">{source.name}</span>
                  </div>
                  <span className="text-sm font-black text-gray-900">${source.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Sales Table */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50">
              <h3 className="text-xl font-black text-gray-900">Recent Sales Activity</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Source</th>
                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {allSales.slice(0, 10).map((sale, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-600">
                        {new Date(sale.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-900">{sale.contactName || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{sale.contactEmail}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          sale.source === 'Sheet' ? 'bg-indigo-100 text-indigo-700' :
                          sale.source === 'Elective' ? 'bg-amber-100 text-amber-700' :
                          'bg-pink-100 text-pink-700'
                        }`}>
                          {sale.source}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-gray-900">
                        ${sale.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {allSales.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500 font-medium">
                        No sales recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
