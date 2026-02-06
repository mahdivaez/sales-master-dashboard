'use client';

import { FileText, Users, DollarSign, Building2, TrendingUp } from 'lucide-react';

interface SheetDataSummaryProps {
  totalRecords: number;
  totalAmount: number;
  byPlatform: Array<{
    platform: string;
    amount: number;
    count: number;
  }>;
  byCloser: Record<string, { count: number; amount: number }>;
  bySetter: Record<string, { count: number; amount: number }>;
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
  iconBg: string;
}

const Card = ({ title, value, icon, subtitle, gradient, borderColor, hoverBorder, iconBg }: CardProps) => {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl p-5 border-2 ${borderColor} hover:${hoverBorder} transition-all duration-300 shadow-sm hover:shadow-md`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 ${iconBg} rounded-lg backdrop-blur-sm shadow-sm`}>
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

export function SheetDataSummary({ 
  totalRecords, 
  totalAmount, 
  byPlatform, 
  byCloser, 
  bySetter,
  loading 
}: SheetDataSummaryProps) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl border-2 border-gray-300"></div>
          ))}
        </div>
      </div>
    );
  }

  const topClosers = Object.entries(byCloser)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const topSetters = Object.entries(bySetter)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const cards: CardProps[] = [
    {
      title: 'Total Records',
      value: formatNumber(totalRecords),
      icon: <FileText className="w-5 h-5 text-blue-600" />,
      subtitle: 'All sheet entries',
      gradient: 'from-blue-50 to-indigo-50',
      borderColor: 'border-blue-300',
      hoverBorder: 'border-blue-500',
      iconBg: 'bg-blue-100'
    },
    {
      title: 'Total Amount',
      value: formatCurrency(totalAmount),
      icon: <DollarSign className="w-5 h-5 text-green-600" />,
      subtitle: 'Combined value',
      gradient: 'from-green-50 to-emerald-50',
      borderColor: 'border-green-300',
      hoverBorder: 'border-green-500',
      iconBg: 'bg-green-100'
    },
    {
      title: 'Top Closer',
      value: topClosers[0]?.name || 'N/A',
      icon: <TrendingUp className="w-5 h-5 text-indigo-600" />,
      subtitle: topClosers[0] ? formatCurrency(topClosers[0].amount) : '',
      gradient: 'from-indigo-50 to-purple-50',
      borderColor: 'border-indigo-300',
      hoverBorder: 'border-indigo-500',
      iconBg: 'bg-indigo-100'
    },
    {
      title: 'Top Setter',
      value: topSetters[0]?.name || 'N/A',
      icon: <Building2 className="w-5 h-5 text-slate-600" />,
      subtitle: topSetters[0] ? formatCurrency(topSetters[0].amount) : '',
      gradient: 'from-slate-50 to-gray-50',
      borderColor: 'border-slate-300',
      hoverBorder: 'border-slate-500',
      iconBg: 'bg-slate-100'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Main Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <Card key={index} {...card} />
        ))}
      </div>

      {/* Platform breakdown */}
      {byPlatform.length > 0 && (
        <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border-2 border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-600" />
            By Platform
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {byPlatform.map((platform, index) => (
              <div key={index} className="bg-white rounded-xl p-4 border-2 border-gray-200 hover:border-gray-400 transition-all duration-300 shadow-sm hover:shadow-md">
                <p className="text-sm font-semibold text-gray-600">{platform.platform}</p>
                <p className="text-xl font-black text-gray-900 mt-1">{formatCurrency(platform.amount)}</p>
                <p className="text-xs text-gray-500 font-medium">{formatNumber(platform.count)} records</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top performers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {topClosers.length > 0 && (
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Top Closers
            </h3>
            <div className="space-y-3">
              {topClosers.map((closer, index) => (
                <div key={index} className="flex items-center justify-between bg-white rounded-xl p-3 border-2 border-indigo-100 hover:border-indigo-300 transition-all duration-300 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      {index + 1}
                    </div>
                    <span className="font-bold text-gray-700">{closer.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-gray-900">{formatCurrency(closer.amount)}</p>
                    <p className="text-xs text-gray-500 font-medium">{closer.count} deals</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {topSetters.length > 0 && (
          <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-6 border-2 border-slate-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-slate-600" />
              Top Setters
            </h3>
            <div className="space-y-3">
              {topSetters.map((setter, index) => (
                <div key={index} className="flex items-center justify-between bg-white rounded-xl p-3 border-2 border-slate-100 hover:border-slate-300 transition-all duration-300 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-gray-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      {index + 1}
                    </div>
                    <span className="font-bold text-gray-700">{setter.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-gray-900">{formatCurrency(setter.amount)}</p>
                    <p className="text-xs text-gray-500 font-medium">{setter.count} deals</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}