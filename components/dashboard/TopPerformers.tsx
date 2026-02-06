'use client';

import { Trophy, User, Mail, TrendingUp } from 'lucide-react';

interface TopPerformersProps {
  data: Array<{
    userId: string;
    name: string;
    email: string;
    totalRevenue: number;
    paymentCount: number;
    averageOrderValue: number;
  }>;
  loading?: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US').format(Math.round(num));
};

export function TopPerformers({ data, loading }: TopPerformersProps) {
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-xl border-2 border-gray-300"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-200">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-amber-600" />
          <h3 className="text-lg font-bold text-gray-900">Top Performers</h3>
        </div>
        <div className="h-64 flex items-center justify-center text-gray-400 font-medium">
          No data available
        </div>
      </div>
    );
  }

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <Trophy className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <Trophy className="w-5 h-5 text-amber-600" />;
    return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-600">{index + 1}</span>;
  };

  const getRankStyle = (index: number) => {
    if (index === 0) return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-300 hover:border-yellow-500';
    if (index === 1) return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300 hover:border-gray-500';
    if (index === 2) return 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 hover:border-amber-500';
    return 'bg-gradient-to-r from-white to-gray-50 border-gray-200 hover:border-gray-400';
  };

  const getGradient = (index: number) => {
    if (index === 0) return 'from-yellow-500 to-amber-600';
    if (index === 1) return 'from-gray-400 to-gray-600';
    if (index === 2) return 'from-amber-500 to-orange-600';
    return 'from-indigo-500 to-purple-600';
  };

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-amber-600" />
          <h3 className="text-lg font-bold text-gray-900">Top Performers</h3>
        </div>
        <span className="px-3 py-1 bg-white rounded-lg border border-amber-200 text-sm font-medium text-amber-600">
          By Revenue
        </span>
      </div>
      <div className="space-y-3">
        {data.slice(0, 10).map((performer, index) => (
          <div 
            key={performer.userId}
            className={`flex items-center gap-4 p-3 rounded-xl border-2 ${getRankStyle(index)} transition-all duration-300 hover:shadow-md`}
          >
            <div className="flex-shrink-0">
              {getRankIcon(index)}
            </div>
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br ${getGradient(index)} flex items-center justify-center shadow-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 truncate">
                {performer.name || 'Unknown User'}
              </p>
              <div className="flex items-center gap-1 text-sm text-gray-500 truncate">
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span className="truncate font-medium">{performer.email}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-black text-gray-900 text-lg">{formatCurrency(performer.totalRevenue)}</p>
              <p className="text-xs text-gray-500 font-medium">
                {performer.paymentCount} payments • {formatCurrency(performer.averageOrderValue)} avg
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}