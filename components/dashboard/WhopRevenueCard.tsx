'use client';

import { DollarSign, TrendingUp, CreditCard, Percent } from 'lucide-react';

interface WhopRevenueCardProps {
  totalRevenue: number;
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  refundedPayments: number;
  averageOrderValue: number;
  loading: boolean;
}

export function WhopRevenueCard({
  totalRevenue,
  totalPayments,
  successfulPayments,
  failedPayments,
  refundedPayments,
  averageOrderValue,
  loading
}: WhopRevenueCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const successRate = totalPayments > 0 ? ((successfulPayments / totalPayments) * 100).toFixed(1) : '0';

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl border border-gray-300"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
          <DollarSign className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Whop Revenue</h3>
          <p className="text-sm text-gray-500 font-medium">Whop payment analytics and performance</p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border-2 border-indigo-200 hover:border-indigo-400 transition-all duration-300 shadow-sm hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-indigo-600" />
            </div>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-sm font-semibold text-indigo-600 mb-1">Total Revenue</p>
          <p className="text-2xl font-black text-gray-900">{formatCurrency(totalRevenue)}</p>
        </div>

        {/* Successful Payments */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-5 border-2 border-emerald-200 hover:border-emerald-400 transition-all duration-300 shadow-sm hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          </div>
          <p className="text-sm font-semibold text-emerald-600 mb-1">Successful</p>
          <p className="text-2xl font-black text-gray-900">{successfulPayments.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{successRate}% success rate</p>
        </div>

        {/* Failed Payments */}
        <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-5 border-2 border-red-200 hover:border-red-400 transition-all duration-300 shadow-sm hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <CreditCard className="w-5 h-5 text-red-600" />
            </div>
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          </div>
          <p className="text-sm font-semibold text-red-600 mb-1">Failed</p>
          <p className="text-2xl font-black text-gray-900">{failedPayments.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">Needs attention</p>
        </div>

        {/* Average Order Value */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border-2 border-amber-200 hover:border-amber-400 transition-all duration-300 shadow-sm hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Percent className="w-5 h-5 text-amber-600" />
            </div>
            <Percent className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-sm font-semibold text-amber-600 mb-1">Avg Order Value</p>
          <p className="text-2xl font-black text-gray-900">{formatCurrency(averageOrderValue)}</p>
          <p className="text-xs text-gray-500 mt-1">Per transaction</p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-3xl font-black text-gray-900">{totalPayments.toLocaleString()}</p>
          <p className="text-sm font-medium text-gray-500">Total Payments</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-3xl font-black text-gray-900">{refundedPayments.toLocaleString()}</p>
          <p className="text-sm font-medium text-gray-500">Refunded</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-3xl font-black text-indigo-600">{formatCurrency(totalRevenue / Math.max(successfulPayments, 1))}</p>
          <p className="text-sm font-medium text-gray-500">Net per Success</p>
        </div>
      </div>
    </div>
  );
}