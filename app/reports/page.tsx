'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Download, 
  Filter, 
  Calendar,
  DollarSign,
  CreditCard,
  TrendingUp,
  RefreshCw,
  LayoutDashboard,
  ArrowLeft,
  Target,
  Zap,
  Layers,
  Users
} from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from '@/components/DateRangePicker';
import { COMPANIES } from '@/lib/config';
import Link from 'next/link';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';

interface RevenueData {
  date: string;
  whopRevenue: number;
  electiveRevenue: number;
  fanbasisRevenue: number;
  totalRevenue: number;
}

interface PaymentStatusData {
  status: string;
  count: number;
  amount: number;
  percentage: number;
}

interface ReportData {
  type: string;
  generatedAt: string;
  filters: {
    startDate: string;
    endDate: string;
    companyId?: string;
  };
  data: any[];
  summary: {
    totalRecords: number;
    totalAmount?: number;
    averageAmount?: number;
  };
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

const SOURCE_COLORS = [
  { name: 'Whop', fill: '#6366f1' },
  { name: 'Elective', fill: '#f59e0b' },
  { name: 'Fanbasis', fill: '#ec4899' }
];

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [revenueData, setRevenueData] = useState<ReportData | null>(null);
  const [paymentsData, setPaymentsData] = useState<ReportData | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');

  const fetchReport = useCallback(async (reportType: string) => {
    try {
      const params = new URLSearchParams();
      params.set('type', reportType);
      if (dateRange?.from) params.set('from', dateRange.from.toISOString());
      if (dateRange?.to) params.set('to', dateRange.to.toISOString());
      if (selectedCompanyId !== 'all') params.set('company_id', selectedCompanyId);

      const response = await fetch(`/api/analytics/reports?${params.toString()}`);
      const result = await response.json();

      if (!result.error) {
        if (reportType === 'revenue') {
          setRevenueData(result);
        } else if (reportType === 'payments') {
          setPaymentsData(result);
        }
      }
    } catch (err: any) {
      console.error('Error fetching report:', err);
    }
  }, [dateRange, selectedCompanyId]);

  const fetchAllReports = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchReport('revenue'), fetchReport('payments')]);
    setLoading(false);
  }, [fetchReport]);

  useEffect(() => {
    fetchAllReports();
  }, [fetchAllReports]);

  const handleExport = (format: 'csv' | 'json') => {
    if (!revenueData) return;

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(revenueData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `revenue-report-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      if (revenueData.data.length === 0) return;
      
      const headers = Object.keys(revenueData.data[0]);
      const csvRows: string[] = [headers.join(',')];
      
      revenueData.data.forEach(row => {
        const csvRow = headers.map(h => {
          const val = row[h];
          if (typeof val === 'string' && val.includes(',')) {
            return `"${val}"`;
          }
          return String(val);
        }).join(',');
        csvRows.push(csvRow);
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `revenue-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatChartDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Process revenue data for charts
  const getRevenueChartData = () => {
    if (!revenueData?.data) return [];
    const grouped: Record<string, RevenueData> = {};
    
    revenueData.data.forEach((item: any) => {
      const dateKey = new Date(item.date).toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: dateKey,
          whopRevenue: 0,
          electiveRevenue: 0,
          fanbasisRevenue: 0,
          totalRevenue: 0
        };
      }
      
      const source = item.source?.toLowerCase();
      if (source === 'whop') {
        grouped[dateKey].whopRevenue += item.amount || 0;
      } else if (source === 'elective') {
        grouped[dateKey].electiveRevenue += item.amount || 0;
      } else if (source === 'fanbasis') {
        grouped[dateKey].fanbasisRevenue += item.amount || 0;
      }
      grouped[dateKey].totalRevenue += item.amount || 0;
    });

    return Object.values(grouped).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  // Process revenue by source
  const getRevenueBySource = () => {
    if (!revenueData?.data) return [];
    const sources: Record<string, number> = {};
    
    revenueData.data.forEach((item: any) => {
      const source = item.source || 'Unknown';
      sources[source] = (sources[source] || 0) + (item.amount || 0);
    });

    return Object.entries(sources).map(([name, value], index) => ({
      name,
      value,
      fill: SOURCE_COLORS[index % SOURCE_COLORS.length].fill
    }));
  };

  // Process payments by status
  const getPaymentsByStatus = (): PaymentStatusData[] => {
    if (!paymentsData?.data) return [];
    const statuses: Record<string, { count: number; amount: number }> = {};
    
    paymentsData.data.forEach((item: any) => {
      const status = item.status || 'unknown';
      if (!statuses[status]) {
        statuses[status] = { count: 0, amount: 0 };
      }
      statuses[status].count++;
      statuses[status].amount += item.amount || 0;
    });

    const total = Object.values(statuses).reduce((sum, s) => sum + s.amount, 0);
    
    return Object.entries(statuses).map(([status, data]) => ({
      status,
      count: data.count,
      amount: data.amount,
      percentage: total > 0 ? (data.amount / total) * 100 : 0
    }));
  };

  const revenueChartData = getRevenueChartData();
  const revenueBySource = getRevenueBySource();
  const paymentsByStatus = getPaymentsByStatus();

  // Get combined stats
  const totalRevenue = revenueData?.summary.totalAmount || 0;
  const totalTransactions = revenueData?.summary.totalRecords || 0;
  const averageOrder = revenueData?.summary.averageAmount || 0;
  const totalPayments = paymentsData?.summary.totalAmount || 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/dashboard" className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">Reports</h1>
            </div>
            <p className="text-gray-500 font-medium ml-12">Unified Revenue & Payments Analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/reports/team"
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all shadow-md"
            >
              <Users className="w-4 h-4" />
              Team Reports
            </Link>
            <Link 
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-md"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <button
              onClick={fetchAllReports}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-700 outline-none"
            >
              <option value="all">All Companies</option>
              {COMPANIES.map(company => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>
          <DateRangePicker range={dateRange} onRangeChange={setDateRange} />
        </div>

        {loading && !revenueData ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl shadow-xl border border-gray-100">
            <RefreshCw className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
            <p className="text-gray-500 font-bold animate-pulse">Loading reports...</p>
          </div>
        ) : revenueData ? (
          <div className="space-y-8">
            {/* Combined Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="w-5 h-5 text-blue-600" />
                  <p className="text-sm text-gray-600 font-medium">Transactions</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{totalTransactions.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-5 border-2 border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  <p className="text-sm text-gray-600 font-medium">Average Order</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(averageOrder)}</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border-2 border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-5 h-5 text-amber-600" />
                  <p className="text-sm text-gray-600 font-medium">Payment Volume</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPayments)}</p>
              </div>
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-5 border-2 border-pink-200">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-pink-600" />
                  <p className="text-sm text-gray-600 font-medium">Period</p>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {revenueData.filters.startDate ? formatDate(revenueData.filters.startDate) : 'All time'}
                </p>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Revenue Trend Chart */}
              <div className="lg:col-span-2 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
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
                    <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorWhopReport" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorElectiveReport" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorFanbasisReport" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(val) => formatChartDate(String(val))}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length && label) {
                            return (
                              <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-gray-200">
                                <p className="text-sm font-bold text-gray-900 mb-2">{formatChartDate(String(label))}</p>
                                {payload.map((entry: any, index: number) => (
                                  <div key={index} className="flex items-center gap-2 text-sm mb-1">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                                    <span className="text-gray-600 capitalize font-medium">
                                      {String(entry.name).replace('Revenue', '')}:
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                      ${entry.value.toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area type="monotone" dataKey="whopRevenue" stackId="1" stroke="#6366f1" fill="url(#colorWhopReport)" strokeWidth={2} />
                      <Area type="monotone" dataKey="electiveRevenue" stackId="1" stroke="#f59e0b" fill="url(#colorElectiveReport)" strokeWidth={2} />
                      <Area type="monotone" dataKey="fanbasisRevenue" stackId="1" stroke="#ec4899" fill="url(#colorFanbasisReport)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Revenue by Source Pie Chart */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-gray-900">Revenue by Source</h3>
                  </div>
                  <div className="px-3 py-1 bg-white rounded-lg border border-blue-200 text-xl font-black text-blue-600">
                    {formatCurrency(revenueBySource.reduce((sum, s) => sum + s.value, 0))}
                  </div>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={revenueBySource}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {revenueBySource.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            const total = revenueBySource.reduce((sum, s) => sum + s.value, 0);
                            const percentage = ((data.value / total) * 100).toFixed(1);
                            return (
                              <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-gray-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: data.fill }} />
                                  <span className="font-bold text-gray-900">{data.name}</span>
                                </div>
                                <p className="text-sm text-gray-600">
                                  Revenue: <span className="font-semibold text-gray-900">${data.value.toLocaleString()}</span>
                                </p>
                                <p className="text-sm text-gray-600">
                                  Share: <span className="font-semibold text-gray-900">{percentage}%</span>
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Payments by Status Chart */}
            {paymentsByStatus.length > 0 && (
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-6 border-2 border-purple-200">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-bold text-gray-900">Payments by Status</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleExport('csv')}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                    <button
                      onClick={() => handleExport('json')}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Export JSON
                    </button>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentsByStatus} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                      <XAxis type="number" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={{ stroke: '#e5e7eb' }} tickLine={false} />
                      <YAxis type="category" dataKey="status" tickFormatter={(val) => formatStatus(String(val))} tick={{ fontSize: 12, fill: '#374151' }} axisLine={false} tickLine={false} width={100} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-gray-200">
                                <p className="font-bold text-gray-900 mb-2">{formatStatus(String(data.status))}</p>
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
                        }}
                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={40}>
                        {paymentsByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={STATUS_COLORS[String(entry.status).toLowerCase()] || STATUS_COLORS.unknown} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Unified Combined Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between p-6 border-b border-gray-100 gap-4 bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-100 rounded-xl">
                    <Layers className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Combined Revenue Data</h2>
                    <p className="text-sm text-gray-500">
                      All revenue sources: Whop, Elective, Fanbasis
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg font-medium">
                    {revenueData.data.length} records
                  </span>
                  <span>•</span>
                  <span>Updated: {formatDate(revenueData.generatedAt)}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Platform</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fees</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Net Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {revenueData.data.slice(0, 100).map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{formatDate(row.date)}</td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            row.source === 'Whop' ? 'bg-indigo-100 text-indigo-700' :
                            row.source === 'Elective' ? 'bg-amber-100 text-amber-700' :
                            row.source === 'Fanbasis' ? 'bg-pink-100 text-pink-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {row.source}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{row.platform || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate" title={row.customerName || row.customerEmail}>
                          {row.customerName || row.customerEmail || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{formatCurrency(row.amount)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{formatCurrency(row.fees || 0)}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-green-600 whitespace-nowrap">{formatCurrency(row.netAmount)}</td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            row.status === 'paid' || row.status === 'succeeded' ? 'bg-green-100 text-green-700' :
                            row.status === 'refunded' ? 'bg-amber-100 text-amber-700' :
                            row.status === 'failed' ? 'bg-red-100 text-red-700' :
                            row.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {formatStatus(row.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {revenueData.data.length > 100 && (
                <div className="p-4 text-center text-gray-500 text-sm border-t border-gray-100 bg-gray-50">
                  Showing 100 of {revenueData.data.length} records. Export to see all data.
                </div>
              )}
              {revenueData.data.length === 0 && (
                <div className="p-12 text-center">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No data found for the selected filters.</p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}