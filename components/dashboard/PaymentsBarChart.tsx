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
import { CreditCard } from 'lucide-react';

interface PaymentsBarChartProps {
  data: Array<{
    status: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
  loading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  paid: '#22c55e',
  succeeded: '#22c55e',
  failed: '#ef4444',
  refunded: '#f59e0b',
  pending: '#f97316',
  cancelled: '#6b7280',
  resolution_won: '#10b981',
  resolution_lost: '#ef4444',
  unknown: '#9ca3af'
};

const formatStatus = (status: string) => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-gray-200">
        <p className="font-bold text-gray-900 mb-2">{formatStatus(data.status)}</p>
        <div className="space-y-1 text-sm">
          <p className="text-gray-600">
            Count: <span className="font-semibold text-gray-900">{data.count}</span>
          </p>
          <p className="text-gray-600">
            Amount: <span className="font-semibold text-gray-900">${data.amount.toLocaleString()}</span>
          </p>
          <p className="text-gray-600">
            Share: <span className="font-semibold text-gray-900">{data.percentage.toFixed(1)}%</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function PaymentsBarChart({ data, loading }: PaymentsBarChartProps) {
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
      <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border-2 border-purple-200">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-bold text-gray-900">Payments by Status</h3>
        </div>
        <div className="h-64 flex items-center justify-center text-gray-400 font-medium">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border-2 border-purple-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-bold text-gray-900">Payments by Status</h3>
        </div>
        <div className="px-3 py-1 bg-white rounded-lg border border-purple-200 text-sm font-medium text-purple-600">
          {data.length} statuses
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
            <XAxis 
              type="number"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={false}
            />
            <YAxis 
              type="category"
              dataKey="status"
              tickFormatter={formatStatus}
              tick={{ fontSize: 12, fill: '#374151' }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={40}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={STATUS_COLORS[entry.status.toLowerCase()] || STATUS_COLORS.unknown}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}