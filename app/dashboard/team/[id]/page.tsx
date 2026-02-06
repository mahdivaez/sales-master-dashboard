'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  ChevronLeft,
  DollarSign,
  Target,
  TrendingUp,
  Calendar,
  Phone,
  Mail,
  Crown,
  Shield,
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

interface Deal {
  id: string;
  contactName: string;
  contactEmail: string;
  amount: number;
  date: string;
  platform?: string;
  type?: string;
}

export default function TeamMemberDetailPage() {
  const [member, setMember] = useState<TeamMember | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const memberId = params.id as string;

  useEffect(() => {
    fetchMemberData();
  }, [memberId]);

  const fetchMemberData = async () => {
    try {
      const response = await fetch('/api/team?role=all');
      const members = await response.json();
      const foundMember = members.find((m: TeamMember) => m.id === memberId);
      
      if (foundMember) {
        setMember(foundMember);
        
        // Fetch deals for this member
        const sheetResponse = await fetch('/api/sheet-data');
        const sheetData = await sheetResponse.json();
        
        const memberDeals = sheetData.filter((d: any) => 
          d.closer === foundMember.name || d.setter === foundMember.name
        );
        
        setDeals(memberDeals);
      }
    } catch (error) {
      console.error('Error fetching member data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-5 h-5" />;
      case 'closer': return <Crown className="w-5 h-5" />;
      case 'setter': return <Phone className="w-5 h-5" />;
      default: return <Users className="w-5 h-5" />;
    }
  };

  const getRoleGradient = (role: string) => {
    switch (role) {
      case 'admin': return 'from-purple-500 to-violet-600';
      case 'closer': return 'from-amber-500 to-orange-600';
      case 'setter': return 'from-green-500 to-emerald-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-cyan-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-cyan-500 rounded-full animate-spin mb-4" />
          <p className="text-gray-500 font-bold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-cyan-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 font-bold mb-4">Team member not found</p>
          <Link href="/dashboard/team-closers" className="text-cyan-600 font-bold hover:underline">
            Go back to team
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-cyan-100 p-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div className="flex items-center gap-4">
            <Link 
              href={member.role === 'closer' ? '/dashboard/team-closers' : '/dashboard/team-setters'}
              className="p-3 bg-white rounded-xl shadow-md hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className={`p-3 bg-gradient-to-br ${getRoleGradient(member.role)} rounded-2xl shadow-lg border-2 border-white/20`}>
                  {getRoleIcon(member.role)}
                </div>
                <div>
                  <h1 className="text-4xl font-black text-gray-900 tracking-tight">{member.name}</h1>
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider capitalize">{member.role}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-md hover:shadow-lg"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-200 p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className={`w-24 h-24 bg-gradient-to-br ${getRoleGradient(member.role)} rounded-3xl flex items-center justify-center text-white text-4xl font-black shadow-lg`}>
              {member.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black text-gray-900 mb-2">{member.name}</h2>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="font-medium">{member.email}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium">Joined {new Date(member.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-xl font-bold text-sm ${
              member.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {member.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-3xl font-black text-gray-900">${member.stats.totalRevenue.toLocaleString()}</p>
            <p className="text-gray-500 font-medium">Total Revenue</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl">
                <Crown className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-3xl font-black text-gray-900">{member.stats.closerCount}</p>
            <p className="text-gray-500 font-medium">Deals Closed</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl">
                <Phone className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-3xl font-black text-gray-900">{member.stats.setterCount}</p>
            <p className="text-gray-500 font-medium">Leads Set</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-400 to-violet-500 rounded-xl">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-3xl font-black text-gray-900">
              ${member.stats.closerCount > 0 ? Math.round(member.stats.closerAmount / member.stats.closerCount).toLocaleString() : 0}
            </p>
            <p className="text-gray-500 font-medium">Avg Deal Size</p>
          </div>
        </div>

        {/* Performance Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-500 rounded-lg">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-black text-gray-900">Closer Performance</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Deals Closed</span>
                <span className="font-bold text-gray-900">{member.stats.closerCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Revenue Generated</span>
                <span className="font-black text-green-600">${member.stats.closerAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Average Deal</span>
                <span className="font-bold text-gray-900">
                  ${member.stats.closerCount > 0 ? Math.round(member.stats.closerAmount / member.stats.closerCount).toLocaleString() : 0}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-500 rounded-lg">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-black text-gray-900">Setter Performance</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Leads Set</span>
                <span className="font-bold text-gray-900">{member.stats.setterCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Revenue Generated</span>
                <span className="font-black text-green-600">${member.stats.setterAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Average Deal</span>
                <span className="font-bold text-gray-900">
                  ${member.stats.setterCount > 0 ? Math.round(member.stats.setterAmount / member.stats.setterCount).toLocaleString() : 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Deals */}
        <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-black text-gray-900">Recent Deals</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Platform</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {deals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <p className="text-gray-500 font-medium">No deals found</p>
                    </td>
                  </tr>
                ) : (
                  deals.slice(0, 10).map((deal) => (
                    <tr key={deal.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {new Date(deal.date).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-gray-900">{deal.contactName || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{deal.contactEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg font-bold text-xs">
                          {deal.platform || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-600">{deal.type || '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-black text-green-600">${deal.amount.toLocaleString()}</span>
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