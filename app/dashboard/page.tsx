'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  RefreshCw,
  Loader2,
  AlertCircle,
  FileText,
  Download,
  TrendingUp,
  DollarSign,
  Users,
  Target,
  Zap,
  BarChart3,
  PieChart,
  Activity,
  CreditCard,
  TrendingDown,
  Percent,
  ShoppingBag,
  Database
} from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from '@/components/DateRangePicker';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { RevenueSourceChart } from '@/components/dashboard/RevenueSourceChart';
import { PaymentsBarChart } from '@/components/dashboard/PaymentsBarChart';
import { MembershipStatusChart } from '@/components/dashboard/MembershipStatusChart';
import { TopPerformers } from '@/components/dashboard/TopPerformers';
import { ElectiveRevenueCard } from '@/components/dashboard/ElectiveRevenueCard';
import { FanbasisRevenueCard } from '@/components/dashboard/FanbasisRevenueCard';
import { FanbasisStatusChart } from '@/components/dashboard/FanbasisStatusChart';
import { FanbasisProductChart } from '@/components/dashboard/FanbasisProductChart';
import { SheetDataSummary } from '@/components/dashboard/SheetDataSummary';
import { WhopRevenueCard } from '@/components/dashboard/WhopRevenueCard';
import Link from 'next/link';

interface DashboardData {
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
    electiveRevenue: number;
    electiveCount: number;
    electiveAOV: number;
    fanbasisRevenue: number;
    fanbasisCount: number;
    fanbasisAOV: number;
    fanbasisDiscountSavings: number;
    fanbasisWithDiscountCount: number;
  };
  revenueTrend: Array<{
    date: string;
    whopRevenue: number;
    electiveRevenue: number;
    fanbasisRevenue: number;
    totalRevenue: number;
  }>;
  paymentsByStatus: Array<{
    status: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
  membershipsByStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  topPerformers: Array<{
    userId: string;
    name: string;
    email: string;
    totalRevenue: number;
    paymentCount: number;
    averageOrderValue: number;
  }>;
  productPerformance: Array<{
    productName: string;
    productId: string;
    totalSales: number;
    totalRevenue: number;
    averagePrice: number;
  }>;
  dailyTransactions: Array<{
    name: string;
    value: number;
  }>;
  revenueBySource: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
  userGrowth: Array<{
    name: string;
    value: number;
  }>;
  appointmentStats: {
    total: number;
    completed: number;
    scheduled: number;
    cancelled: number;
    completionRate: number;
  };
  electiveData: {
    trend: Array<{ date: string; amount: number }>;
    totalRevenue: number;
    totalCount: number;
    averageOrderValue: number;
  };
  fanbasisData: {
    trend: Array<{ date: string; amount: number }>;
    totalRevenue: number;
    totalCount: number;
    averageOrderValue: number;
    byStatus: Array<{
      status: string;
      count: number;
      amount: number;
      percentage: number;
    }>;
    byProduct: Array<{
      product: string;
      count: number;
      amount: number;
      percentage: number;
    }>;
    byPaymentMethod: Array<{
      method: string;
      amount: number;
    }>;
    discountAnalysis: {
      totalDiscounts: number;
      totalSavings: number;
      discountedOrders: number;
    };
  };
  sheetData: {
    totalRecords: number;
    totalAmount: number;
    byPlatform: Array<{
      platform: string;
      amount: number;
      count: number;
    }>;
    byCloser: Record<string, { count: number; amount: number }>;
    bySetter: Record<string, { count: number; amount: number }>;
  };
  pipelineStats: Array<{
    pipelineId: string;
    pipelineName: string;
    stages: Array<{
      stageId: string;
      stageName: string;
      count: number;
      value: number;
    }>;
  }>;
  filters: {
    startDate: string;
    endDate: string;
    companyId?: string;
    days: number;
  };
}

// Enhanced Section Header Component with more creative design
function SectionHeader({ 
  title, 
  subtitle, 
  icon: Icon,
  gradient = 'from-cyan-500 to-blue-600',
  borderColor = 'border-cyan-300'
}: { 
  title: string; 
  subtitle?: string; 
  icon?: React.ElementType;
  gradient?: string;
  borderColor?: string;
}) {
  return (
    <div className="flex items-center gap-4 mb-6">
      {Icon && (
        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg shadow-cyan-500/25 border-2 ${borderColor}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      )}
      <div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-gray-500 font-medium">{subtitle}</p>}
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent ml-4" />
    </div>
  );
}

// Creative Card Wrapper with borders and dark accents
function CardWrapper({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [days, setDays] = useState(30);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('days', days.toString());
      if (dateRange?.from) params.set('from', dateRange.from.toISOString());
      if (dateRange?.to) params.set('to', dateRange.to.toISOString());

      const response = await fetch(`/api/analytics/dashboard?${params.toString()}`);
      const result = await response.json();

      if (result.error) {
        setError(result.error);
      } else {
        setData(result);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, [dateRange, days]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = () => {
    if (!data) return;
    
    const exportData = {
      summary: data.summary,
      revenueTrend: data.revenueTrend,
      paymentsByStatus: data.paymentsByStatus,
      membershipsByStatus: data.membershipsByStatus,
      topPerformers: data.topPerformers,
      exportedAt: new Date().toISOString(),
      filters: data.filters
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `triton-dashboard-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-cyan-100 p-8">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg shadow-cyan-500/25 border-2 border-cyan-400/30">
                <LayoutDashboard className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Triton</h1>
                <p className="text-sm font-semibold text-cyan-600 uppercase tracking-wider">Analytics Dashboard</p>
              </div>
            </div>
            <p className="text-gray-500 font-medium ml-14">Real-time business intelligence & insights</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/unified"
              className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition-all shadow-md hover:shadow-lg"
            >
              <Database className="w-4 h-4" />
              Unified
            </Link>
            <Link
              href="/dashboard/team"
              className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition-all shadow-md hover:shadow-lg"
            >
              <Users className="w-4 h-4" />
              Team
            </Link>
            <Link
              href="/reports"
              className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition-all shadow-md hover:shadow-lg"
            >
              <FileText className="w-4 h-4" />
              Reports
            </Link>
            <Link
              href="/reports/team"
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white border-2 border-blue-400 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md hover:shadow-lg"
            >
              <TrendingUp className="w-4 h-4" />
              Team Reports
            </Link>
            <div className="w-px h-8 bg-gray-300 mx-2" />
            <button
              onClick={handleExport}
              disabled={loading || !data}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/25 border-2 border-cyan-400/30 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <DateRangePicker range={dateRange} onRangeChange={setDateRange} />
        </div>

        {/* Loading State */}
        {loading && !data && (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl shadow-xl border-2 border-gray-200">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-gray-200" />
              <div className="absolute top-0 left-0 w-20 h-20 rounded-full border-4 border-transparent border-t-cyan-500 animate-spin" />
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Zap className="w-8 h-8 text-cyan-500" />
              </div>
            </div>
            <p className="text-gray-500 font-bold animate-pulse mt-6 text-lg">Loading analytics...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-8 flex items-center gap-6">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-red-200">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-red-900 mb-1">Error Loading Dashboard</h3>
              <p className="text-red-700 font-medium">{error}</p>
              <button
                onClick={() => fetchData()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors border-2 border-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        {data && !loading && (
          <div className="space-y-10">
            {/* Quick Access Section */}
            <section>
              <SectionHeader 
                title="Quick Access" 
                subtitle="Jump to specific dashboard features"
                icon={Zap}
                gradient="from-yellow-400 to-orange-500"
                borderColor="border-yellow-300"
              />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Link href="/dashboard/unified" className="group">
                  <CardWrapper className="h-full border-blue-100 hover:border-blue-400 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Database className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-black text-gray-900">Unified Database</h3>
                        <p className="text-xs text-gray-500 font-medium">Combined data sources</p>
                      </div>
                    </div>
                  </CardWrapper>
                </Link>
                <Link href="/reports/team" className="group">
                  <CardWrapper className="h-full border-indigo-100 hover:border-indigo-400 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-black text-gray-900">Team Reports</h3>
                        <p className="text-xs text-gray-500 font-medium">Closer & Setter stats</p>
                      </div>
                    </div>
                  </CardWrapper>
                </Link>
                <Link href="/reports" className="group">
                  <CardWrapper className="h-full border-purple-100 hover:border-purple-400 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-100 rounded-xl text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-black text-gray-900">Revenue Reports</h3>
                        <p className="text-xs text-gray-500 font-medium">Detailed financial data</p>
                      </div>
                    </div>
                  </CardWrapper>
                </Link>
                <Link href="/dashboard/team" className="group">
                  <CardWrapper className="h-full border-emerald-100 hover:border-emerald-400 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-black text-gray-900">Team Management</h3>
                        <p className="text-xs text-gray-500 font-medium">Manage users & roles</p>
                      </div>
                    </div>
                  </CardWrapper>
                </Link>
              </div>
            </section>

            {/* Section 1: Key Metrics */}
            <section>
              <SectionHeader 
                title="Key Metrics" 
                subtitle="Overview of your business performance"
                icon={Target}
                gradient="from-cyan-500 to-blue-600"
                borderColor="border-cyan-300"
              />
              <SummaryCards summary={data.summary} loading={loading} />
            </section>

            {/* Section 2: Whop Revenue */}
            <section>
              <SectionHeader 
                title="Whop Revenue" 
                subtitle="Whop payment analytics and performance"
                icon={ShoppingBag}
                gradient="from-indigo-500 to-purple-600"
                borderColor="border-indigo-300"
              />
              <CardWrapper>
                <WhopRevenueCard
                  totalRevenue={data.summary.whopRevenue}
                  totalPayments={data.summary.totalPayments}
                  successfulPayments={data.summary.successfulPayments}
                  failedPayments={data.summary.failedPayments}
                  refundedPayments={data.summary.refundedPayments}
                  averageOrderValue={data.summary.successfulPayments > 0 ? data.summary.whopRevenue / data.summary.successfulPayments : 0}
                  loading={loading}
                />
              </CardWrapper>
            </section>

            {/* Section 3: Revenue Analysis */}
            <section>
              <SectionHeader 
                title="Revenue Analysis" 
                subtitle="Revenue trends and distribution across sources"
                icon={DollarSign}
                gradient="from-green-500 to-emerald-600"
                borderColor="border-green-300"
              />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <CardWrapper className="h-full">
                    <RevenueChart data={data.revenueTrend} loading={loading} />
                  </CardWrapper>
                </div>
                <div>
                  <CardWrapper className="h-full">
                    <RevenueSourceChart data={data.revenueBySource} loading={loading} />
                  </CardWrapper>
                </div>
              </div>
            </section>

            {/* Section 4: Payment & Membership Stats */}
            <section>
              <SectionHeader 
                title="Payment & Membership" 
                subtitle="Payment status and membership distribution"
                icon={CreditCard}
                gradient="from-purple-500 to-violet-600"
                borderColor="border-purple-300"
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CardWrapper>
                  <PaymentsBarChart data={data.paymentsByStatus} loading={loading} />
                </CardWrapper>
                <CardWrapper>
                  <MembershipStatusChart data={data.membershipsByStatus} loading={loading} />
                </CardWrapper>
              </div>
            </section>

            {/* Section 5: Top Performers */}
            <section>
              <SectionHeader 
                title="Top Performers" 
                subtitle="Highest revenue generating users"
                icon={TrendingUp}
                gradient="from-orange-500 to-amber-600"
                borderColor="border-orange-300"
              />
              <CardWrapper>
                <TopPerformers data={data.topPerformers} loading={loading} />
              </CardWrapper>
            </section>

            {/* Section 6: Elective Revenue */}
            <section>
              <SectionHeader 
                title="Elective Revenue" 
                subtitle="Elective sales performance and metrics"
                icon={BarChart3}
                gradient="from-amber-500 to-orange-600"
                borderColor="border-amber-300"
              />
              <CardWrapper>
                <ElectiveRevenueCard 
                  totalRevenue={data.electiveData.totalRevenue}
                  totalCount={data.electiveData.totalCount}
                  averageOrderValue={data.electiveData.averageOrderValue}
                  loading={loading}
                />
              </CardWrapper>
            </section>

            {/* Section 7: Fanbasis Revenue */}
            <section>
              <SectionHeader 
                title="Fanbasis Revenue" 
                subtitle="Fanbasis sales performance and analytics"
                icon={PieChart}
                gradient="from-pink-500 to-rose-600"
                borderColor="border-pink-300"
              />
              <CardWrapper className="mb-6">
                <FanbasisRevenueCard 
                  totalRevenue={data.fanbasisData.totalRevenue}
                  totalCount={data.fanbasisData.totalCount}
                  averageOrderValue={data.fanbasisData.averageOrderValue}
                  discountSavings={data.fanbasisData.discountAnalysis.totalSavings}
                  discountedOrders={data.fanbasisData.discountAnalysis.discountedOrders}
                  loading={loading}
                />
              </CardWrapper>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CardWrapper>
                  <FanbasisStatusChart 
                    data={data.fanbasisData.byStatus}
                    loading={loading}
                  />
                </CardWrapper>
                <CardWrapper>
                  <FanbasisProductChart 
                    data={data.fanbasisData.byProduct}
                    loading={loading}
                  />
                </CardWrapper>
              </div>
            </section>

            {/* Section 8: Sheet Data Summary */}
            <section>
              <SectionHeader 
                title="Sheet Data Summary" 
                subtitle="Manual entry tracking and performance"
                icon={Activity}
                gradient="from-slate-500 to-gray-600"
                borderColor="border-slate-300"
              />
              <CardWrapper>
                <SheetDataSummary 
                  totalRecords={data.sheetData.totalRecords}
                  totalAmount={data.sheetData.totalAmount}
                  byPlatform={data.sheetData.byPlatform}
                  byCloser={data.sheetData.byCloser}
                  bySetter={data.sheetData.bySetter}
                  loading={loading}
                />
              </CardWrapper>
            </section>

            {/* Footer */}
            <div className="text-center py-8">
              <p className="text-gray-400 font-medium">
                Powered by <span className="font-bold text-cyan-600">Triton</span> Analytics
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}