'use client';

import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend
} from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';

interface FanbasisProductChartProps {
  data: Array<{
    product: string;
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

const COLORS = ['#ec4899', '#f43f5e', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#6366f1', '#8b5cf6'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
    const percentage = ((data.amount / total) * 100).toFixed(1);
    
    return (
      <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <div 
            className="w-3 h-3 rounded-full shadow-sm" 
            style={{ backgroundColor: data.fill }}
          />
          <span className="font-bold text-gray-900">{data.product}</span>
        </div>
        <p className="text-sm text-gray-600">
          Revenue: <span className="font-semibold text-gray-900">{formatCurrency(data.amount)}</span>
        </p>
        <p className="text-sm text-gray-600">
          Count: <span className="font-semibold text-gray-900">{data.count}</span>
        </p>
        <p className="text-sm text-gray-600">
          Share: <span className="font-semibold text-gray-900">{percentage}%</span>
        </p>
      </div>
    );
  }
  return null;
};

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null;
  
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor="middle" 
      dominantBaseline="central"
      className="text-xs font-bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function FanbasisProductChart({ data, loading }: FanbasisProductChartProps) {
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
      <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-6 border-2 border-rose-200">
        <div className="flex items-center gap-2 mb-4">
          <PieChartIcon className="w-5 h-5 text-rose-600" />
          <h3 className="text-lg font-bold text-gray-900">Fanbasis by Product</h3>
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

  const total = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-xl p-6 border-2 border-rose-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <PieChartIcon className="w-5 h-5 text-rose-600" />
          <h3 className="text-lg font-bold text-gray-900">Fanbasis by Product</h3>
        </div>
        <div className="px-3 py-1 bg-white rounded-lg border border-rose-200 text-xl font-black text-rose-600">
          {formatCurrency(total)}
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              innerRadius={50}
              fill="#8884d8"
              dataKey="amount"
              paddingAngle={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry: any) => (
                <span className="text-sm font-medium text-gray-700">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}