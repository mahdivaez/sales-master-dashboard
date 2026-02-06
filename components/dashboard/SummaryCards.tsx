'use client';

import { 
  DollarSign, 
  CreditCard, 
  Users, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Target,
  Receipt,
  UserPlus,
  Zap
} from 'lucide-react';

interface SummaryCardsProps {
  summary: {
    totalRevenue: number; // Grand Total from all sources
    whopRevenue: number; // Whop-only revenue
    totalRevenueBeforeFees: number;
    netRevenue: number;
    totalPayments: number;
    successfulPayments: number;
    failedPayments: number;
    refundedPayments: number;
    totalRefundedAmount: number;
    activeMemberships: number;
    totalUsers: number;
    newUsers: number;
    arpu: number;
    whopAOV: number; // Whop-only AOV
    averageOrderValue: number; // Grand total AOV
    conversionRate: number;
  };
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

const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`;
};

interface CardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  subtitle?: string;
  gradient: string;
  borderColor: string;
  hoverBorder: string;
  iconBg: string;
}

const Card = ({ title, value, icon, trend, subtitle, gradient, borderColor, hoverBorder, iconBg }: CardProps) => {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl p-5 border-2 ${borderColor} hover:${hoverBorder} transition-all duration-300 shadow-sm hover:shadow-md`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 ${iconBg} rounded-lg backdrop-blur-sm shadow-sm`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-bold ${trend.isPositive ? 'text-green-600' : 'text-red-600'} bg-white/60 px-2 py-1 rounded-lg`}>
            {trend.isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {formatPercent(Math.abs(trend.value))}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-700">{title}</p>
        <p className="text-2xl font-black text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1 font-medium">{subtitle}</p>}
      </div>
    </div>
  );
};

export function SummaryCards({ summary, loading }: SummaryCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-28 bg-gray-200 rounded-xl border-2 border-gray-300 animate-pulse"></div>
        ))}
      </div>
    );
  }

  const cards: CardProps[] = [
    {
      title: 'Total Revenue',
      value: formatCurrency(summary.totalRevenue),
      icon: <DollarSign className="w-5 h-5 text-cyan-600" />,
      trend: { value: 12.5, isPositive: true },
      subtitle: 'After refunds & fees',
      gradient: 'from-cyan-50 to-blue-50',
      borderColor: 'border-cyan-300',
      hoverBorder: 'border-cyan-500',
      iconBg: 'bg-cyan-100'
    },
    {
      title: 'Net Revenue',
      value: formatCurrency(summary.netRevenue),
      icon: <Target className="w-5 h-5 text-green-600" />,
      trend: { value: 8.2, isPositive: true },
      subtitle: 'Revenue - Refunds',
      gradient: 'from-green-50 to-emerald-50',
      borderColor: 'border-green-300',
      hoverBorder: 'border-green-500',
      iconBg: 'bg-green-100'
    },
    {
      title: 'Successful Payments',
      value: formatNumber(summary.successfulPayments),
      icon: <CreditCard className="w-5 h-5 text-purple-600" />,
      subtitle: `${formatNumber(summary.totalPayments)} total`,
      gradient: 'from-purple-50 to-violet-50',
      borderColor: 'border-purple-300',
      hoverBorder: 'border-purple-500',
      iconBg: 'bg-purple-100'
    },
    {
      title: 'Failed Payments',
      value: formatNumber(summary.failedPayments),
      icon: <Activity className="w-5 h-5 text-red-600" />,
      subtitle: `${formatPercent((summary.failedPayments / summary.totalPayments) * 100)} failure rate`,
      gradient: 'from-red-50 to-pink-50',
      borderColor: 'border-red-300',
      hoverBorder: 'border-red-500',
      iconBg: 'bg-red-100'
    },
    {
      title: 'Active Memberships',
      value: formatNumber(summary.activeMemberships),
      icon: <Users className="w-5 h-5 text-teal-600" />,
      subtitle: `${formatNumber(summary.totalUsers)} total users`,
      gradient: 'from-teal-50 to-cyan-50',
      borderColor: 'border-teal-300',
      hoverBorder: 'border-teal-500',
      iconBg: 'bg-teal-100'
    },
    {
      title: 'New Users',
      value: formatNumber(summary.newUsers),
      icon: <UserPlus className="w-5 h-5 text-orange-600" />,
      trend: { value: 15.3, isPositive: true },
      subtitle: 'In selected period',
      gradient: 'from-orange-50 to-amber-50',
      borderColor: 'border-orange-300',
      hoverBorder: 'border-orange-500',
      iconBg: 'bg-orange-100'
    },
    {
      title: 'ARPU',
      value: formatCurrency(summary.arpu),
      icon: <Receipt className="w-5 h-5 text-pink-600" />,
      subtitle: 'Avg revenue per user',
      gradient: 'from-pink-50 to-rose-50',
      borderColor: 'border-pink-300',
      hoverBorder: 'border-pink-500',
      iconBg: 'bg-pink-100'
    },
    {
      title: 'Average Order Value',
      value: formatCurrency(summary.whopAOV),
      icon: <Zap className="w-5 h-5 text-amber-600" />,
      subtitle: 'Per successful Whop payment',
      gradient: 'from-amber-50 to-yellow-50',
      borderColor: 'border-amber-300',
      hoverBorder: 'border-amber-500',
      iconBg: 'bg-amber-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card key={index} {...card} />
      ))}
    </div>
  );
}