import React from 'react';
import { DollarSign, Users, Target, TrendingUp } from 'lucide-react';

interface DashboardStatsProps {
  totalRevenue: number;
  totalRevenueBeforeFees?: number;
  activeMemberships: number;
  totalUsers: number;
  arpu: number;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  totalRevenue,
  totalRevenueBeforeFees,
  activeMemberships,
  totalUsers,
  arpu,
}) => {
  const stats = [
    {
      label: 'Total Revenue',
      value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalRevenue),
      subValue: totalRevenueBeforeFees ? `${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalRevenueBeforeFees)} Before Fee` : undefined,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Active Memberships',
      value: activeMemberships.toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Total Users',
      value: totalUsers.toLocaleString(),
      icon: Target,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      label: 'ARPU',
      value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(arpu),
      icon: TrendingUp,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2.5 rounded-xl ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{stat.label}</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
          {stat.subValue && (
            <p className="text-xs font-medium text-gray-500 mt-0.5">{stat.subValue}</p>
          )}
        </div>
      ))}
    </div>
  );
};
