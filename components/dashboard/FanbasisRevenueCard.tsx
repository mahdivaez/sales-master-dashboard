'use client';

import { DollarSign, TrendingUp, ShoppingCart, Tag, PieChart } from 'lucide-react';

interface FanbasisRevenueCardProps {
  totalRevenue: number;
  totalCount: number;
  averageOrderValue: number;
  discountSavings: number;
  discountedOrders: number;
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
  gradient: string;
  borderColor: string;
  hoverBorder: string;
}

const Card = ({ title, value, icon, subtitle, gradient, borderColor, hoverBorder }: CardProps) => {
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

export function FanbasisRevenueCard({ 
  totalRevenue, 
  totalCount, 
  averageOrderValue, 
  discountSavings,
  discountedOrders,
  loading 
}: FanbasisRevenueCardProps) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl border-2 border-gray-300"></div>
          ))}
        </div>
      </div>
    );
  }

  const cards: CardProps[] = [
    {
      title: 'Fanbasis Revenue',
      value: formatCurrency(totalRevenue),
      icon: <DollarSign className="w-5 h-5 text-pink-600" />,
      subtitle: 'Total from Fanbasis sales',
      gradient: 'from-pink-50 to-rose-50',
      borderColor: 'border-pink-300',
      hoverBorder: 'border-pink-500'
    },
    {
      title: 'Fanbasis Transactions',
      value: formatNumber(totalCount),
      icon: <ShoppingCart className="w-5 h-5 text-rose-600" />,
      subtitle: 'Total number of sales',
      gradient: 'from-rose-50 to-pink-50',
      borderColor: 'border-rose-300',
      hoverBorder: 'border-rose-500'
    },
    {
      title: 'Fanbasis AOV',
      value: formatCurrency(averageOrderValue),
      icon: <TrendingUp className="w-5 h-5 text-fuchsia-600" />,
      subtitle: 'Average order value',
      gradient: 'from-fuchsia-50 to-pink-50',
      borderColor: 'border-fuchsia-300',
      hoverBorder: 'border-fuchsia-500'
    },
    {
      title: 'Discount Savings',
      value: formatCurrency(discountSavings),
      icon: <Tag className="w-5 h-5 text-purple-600" />,
      subtitle: `${formatNumber(discountedOrders)} discounted orders`,
      gradient: 'from-purple-50 to-fuchsia-50',
      borderColor: 'border-purple-300',
      hoverBorder: 'border-purple-500'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl shadow-lg shadow-pink-500/25 border border-pink-400/30">
          <PieChart className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Fanbasis Revenue</h3>
          <p className="text-sm text-gray-500 font-medium">Fanbasis sales performance and analytics</p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <Card key={index} {...card} />
        ))}
      </div>
    </div>
  );
}