'use client';

import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  Legend
} from 'recharts';
import { Users } from 'lucide-react';

interface MembershipStatusChartProps {
  data: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  loading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  active: '#22c55e',
  trialing: '#3b82f6',
  completed: '#8b5cf6',
  past_due: '#f59e0b',
  cancelled: '#ef4444',
  unpaid: '#6b7280',
  paused: '#f97316',
  unknown: '#9ca3af'
};

const formatStatus = (status: string) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <div 
            className="w-3 h-3 rounded-full shadow-sm" 
            style={{ backgroundColor: STATUS_COLORS[data.status.toLowerCase()] || STATUS_COLORS.unknown }}
          />
          <span className="font-bold text-gray-900">{formatStatus(data.status)}</span>
        </div>
        <p className="text-sm text-gray-600">
          Count: <span className="font-semibold text-gray-900">{data.count}</span>
        </p>
        <p className="text-sm text-gray-600">
          Share: <span className="font-semibold text-gray-900">{data.percentage.toFixed(1)}%</span>
        </p>
      </div>
    );
  }
  return null;
};

export function MembershipStatusChart({ data, loading }: MembershipStatusChartProps) {
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded-xl border-2 border-gray-300"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 border-2 border-teal-200">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-teal-600" />
          <h3 className="text-lg font-bold text-gray-900">Membership Status</h3>
        </div>
        <div className="h-64 flex items-center justify-center text-gray-400 font-medium">
          No data available
        </div>
      </div>
    );
  }

  const chartData = data.map(item => ({
    ...item,
    name: formatStatus(item.status)
  }));

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 border-2 border-teal-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-teal-600" />
          <h3 className="text-lg font-bold text-gray-900">Membership Status</h3>
        </div>
        <div className="px-3 py-1 bg-white rounded-lg border border-teal-200 text-sm font-bold text-teal-600">
          {total.toLocaleString()} total
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
              paddingAngle={2}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={STATUS_COLORS[entry.status.toLowerCase()] || STATUS_COLORS.unknown}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value) => (
                <span className="text-sm font-medium text-gray-700">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}