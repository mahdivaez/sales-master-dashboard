'use client';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { BarChart3 } from 'lucide-react';

interface FanbasisStatusChartProps {
  data: Array<{
    status: string;
    count: number;
    amount: number;
    percentage: number;
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

const COLORS = ['#ec4899', '#f43f5e', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-gray-200">
        <p className="font-bold text-gray-900 mb-2">{data.status}</p>
        <p className="text-sm text-gray-600">
          Count: <span className="font-semibold text-gray-900">{data.count}</span>
        </p>
        <p className="text-sm text-gray-600">
          Amount: <span className="font-semibold text-gray-900">{formatCurrency(data.amount)}</span>
        </p>
        <p className="text-sm text-gray-600">
          Share: <span className="font-semibold text-gray-900">{data.percentage.toFixed(1)}%</span>
        </p>
      </div>
    );
  }
  return null;
};

export function FanbasisStatusChart({ data, loading }: FanbasisStatusChartProps) {
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded-xl border-2 border-gray-300"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border-2 border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-pink-600" />
          <h3 className="text-lg font-bold text-gray-900">Fanbasis by Status</h3>
        </div>
        <div className="h-64 flex items-center justify-center text-gray-400 font-medium">
          No data available
        </div>
      </div>
    );
  }

  const chartData = data.map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length]
  }));

  return (
    <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-6 border-2 border-pink-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-pink-600" />
          <h3 className="text-lg font-bold text-gray-900">Fanbasis by Status</h3>
        </div>
        <div className="px-3 py-1 bg-white rounded-lg border border-pink-200 text-sm font-medium text-pink-600">
          {data.length} statuses
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
            <XAxis type="number" tickFormatter={(value) => `$${value}`} tick={{ fontSize: 12, fill: '#6b7280' }} />
            <YAxis type="category" dataKey="status" width={100} tick={{ fontSize: 12, fill: '#374151' }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}