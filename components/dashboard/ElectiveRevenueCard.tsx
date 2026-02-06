'use client';

import { DollarSign, TrendingUp, ShoppingCart, BarChart3 } from 'lucide-react';

interface ElectiveRevenueCardProps {
  totalRevenue: number;
  totalCount: number;
  averageOrderValue: number;
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

interface CardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  subtitle?: string;
  color: 'amber' | 'orange' | 'yellow';
  gradient: string;
  borderColor: string;
  hoverBorder: string;
}

const Card = ({ title, value, icon, subtitle, color, gradient, borderColor, hoverBorder }: CardProps) => {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl p-5 border-2 ${borderColor} hover:${hoverBorder} transition-all duration-300 shadow-sm hover:shadow-md`}>
      <div className="flex items-start justify-between mb-3">
        <div className="p-2.5 bg-white/60 rounded-lg backdrop-blur-sm">
          {icon}
        </div>
        <div className="w-2 h-2 bg-current rounded-full animate-pulse opacity-60"></div>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-700">{title}</p>
        <p className="text-2xl font-black text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1 font-medium">{subtitle}</p>}
      </div>
    </div>
  );
};

export function ElectiveRevenueCard({ totalRevenue, totalCount, averageOrderValue, loading }: ElectiveRevenueCardProps) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl border-2 border-gray-300"></div>
          ))}
        </div>
      </div>
    );
  }

  const cards: CardProps[] = [
    {
      title: 'Elective Revenue',
      value: formatCurrency(totalRevenue),
      icon: <DollarSign className="w-5 h-5 text-amber-600" />,
      color: 'amber',
      subtitle: 'Total from Elective sales',
      gradient: 'from-amber-50 to-orange-50',
      borderColor: 'border-amber-300',
      hoverBorder: 'border-amber-500'
    },
    {
      title: 'Elective Transactions',
      value: formatNumber(totalCount),
      icon: <ShoppingCart className="w-5 h-5 text-orange-600" />,
      color: 'orange',
      subtitle: 'Total number of sales',
      gradient: 'from-orange-50 to-amber-50',
      borderColor: 'border-orange-300',
      hoverBorder: 'border-orange-500'
    },
    {
      title: 'Elective AOV',
      value: formatCurrency(averageOrderValue),
      icon: <TrendingUp className="w-5 h-5 text-yellow-600" />,
      color: 'yellow',
      subtitle: 'Average order value',
      gradient: 'from-yellow-50 to-amber-50',
      borderColor: 'border-yellow-300',
      hoverBorder: 'border-yellow-500'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg shadow-amber-500/25 border border-amber-400/30">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Elective Revenue</h3>
          <p className="text-sm text-gray-500 font-medium">Elective sales performance and metrics</p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card, index) => (
          <Card key={index} {...card} />
        ))}
      </div>
    </div>
  );
}