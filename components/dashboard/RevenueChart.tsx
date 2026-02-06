'use client';

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface RevenueChartProps {
  data: Array<{
    date: string;
    whopRevenue: number;
    electiveRevenue: number;
    fanbasisRevenue: number;
    totalRevenue: number;
  }>;
  loading?: boolean;
}

const formatCurrency = (value: number) => {
  return `$${(value / 1000).toFixed(0)}k`;
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-gray-200">
        <p className="text-sm font-bold text-gray-900 mb-2">{formatDate(label)}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm mb-1">
            <div 
              className="w-3 h-3 rounded-full shadow-sm" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600 capitalize font-medium">
              {entry.name.replace('Revenue', '')}:
            </span>
            <span className="font-semibold text-gray-900">
              ${entry.value.toLocaleString()}
            </span>
          </div>
        ))}
        <div className="border-t border-gray-200 mt-2 pt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-gray-700">Total:</span>
            <span className="font-black text-gray-900">
              ${payload.reduce((sum: number, entry: any) => sum + entry.value, 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function RevenueChart({ data, loading }: RevenueChartProps) {
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
        <div className="h-72 bg-gray-200 rounded-xl border-2 border-gray-300"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-bold text-gray-900">Revenue Trend</h3>
        </div>
        <div className="h-72 flex items-center justify-center text-gray-400 font-medium">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-bold text-gray-900">Revenue Trend</h3>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 px-2 py-1 bg-white rounded-lg border border-indigo-200">
            <div className="w-3 h-3 rounded-full bg-indigo-500" />
            <span className="text-gray-700 font-medium">Whop</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 bg-white rounded-lg border border-amber-200">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-gray-700 font-medium">Elective</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1 bg-white rounded-lg border border-pink-200">
            <div className="w-3 h-3 rounded-full bg-pink-500" />
            <span className="text-gray-700 font-medium">Fanbasis</span>
          </div>
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorWhop" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorElective" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorFanbasis" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="whopRevenue"
              stackId="1"
              stroke="#6366f1"
              fill="url(#colorWhop)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="electiveRevenue"
              stackId="1"
              stroke="#f59e0b"
              fill="url(#colorElective)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="fanbasisRevenue"
              stackId="1"
              stroke="#ec4899"
              fill="url(#colorFanbasis)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}