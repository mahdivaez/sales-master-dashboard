// Dashboard Types
export interface DashboardSummary {
  totalRevenue: number;
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
  averageOrderValue: number;
  conversionRate: number;
  // Elective Metrics
  electiveRevenue: number;
  electiveCount: number;
  electiveAOV: number;
  // Fanbasis Metrics
  fanbasisRevenue: number;
  fanbasisCount: number;
  fanbasisAOV: number;
  fanbasisDiscountSavings: number;
  fanbasisWithDiscountCount: number;
}

export interface RevenueData {
  date: string;
  whopRevenue: number;
  electiveRevenue: number;
  fanbasisRevenue: number;
  totalRevenue: number;
}

export interface PaymentStatusData {
  status: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface MembershipStatusData {
  status: string;
  count: number;
  percentage: number;
}

export interface PipelineData {
  pipelineId: string;
  pipelineName: string;
  stageId: string;
  stageName: string;
  count: number;
  totalValue: number;
}

export interface TopPerformersData {
  userId: string;
  name: string;
  email: string;
  totalRevenue: number;
  paymentCount: number;
  averageOrderValue: number;
}

export interface ProductPerformanceData {
  productName: string;
  productId: string;
  totalSales: number;
  totalRevenue: number;
  averagePrice: number;
}

export interface GeographicData {
  region?: string;
  country?: string;
  count: number;
  revenue: number;
}

export interface TrendData {
  period: string;
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

export interface DashboardFilters {
  companyId?: string;
  startDate?: string;
  endDate?: string;
  days?: number;
  status?: string;
  product?: string;
  pipeline?: string;
  stage?: string;
}

export interface DashboardData {
  summary: DashboardSummary;
  revenueTrend: RevenueData[];
  paymentsByStatus: PaymentStatusData[];
  membershipsByStatus: MembershipStatusData[];
  topPerformers: TopPerformersData[];
  productPerformance: ProductPerformanceData[];
  dailyTransactions: ChartDataPoint[];
  revenueBySource: ChartDataPoint[];
  userGrowth: ChartDataPoint[];
  appointmentStats: {
    total: number;
    completed: number;
    scheduled: number;
    cancelled: number;
    completionRate: number;
  };
  // New detailed sections
  electiveData: ElectiveDataSummary;
  fanbasisData: FanbasisDataSummary;
  sheetData: SheetDataSummary;
  pipelineStats: PipelineStats[];
}

export interface ElectiveDataSummary {
  trend: Array<{ date: string; amount: number }>;
  totalRevenue: number;
  totalCount: number;
  averageOrderValue: number;
}

export interface FanbasisDataSummary {
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
}

export interface SheetDataSummary {
  totalRecords: number;
  totalAmount: number;
  byPlatform: Array<{
    platform: string;
    amount: number;
    count: number;
  }>;
  byCloser: Record<string, { count: number; amount: number }>;
  bySetter: Record<string, { count: number; amount: number }>;
}

export interface PipelineStats {
  pipelineId: string;
  pipelineName: string;
  stages: Array<{
    stageId: string;
    stageName: string;
    count: number;
    value: number;
  }>;
}

export interface ReportConfig {
  id: string;
  name: string;
  description: string;
  type: 'revenue' | 'payments' | 'memberships' | 'users' | 'appointments' | 'custom';
  filters: DashboardFilters;
  groupBy?: 'day' | 'week' | 'month' | 'product' | 'status' | 'stage';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ReportData {
  reportId: string;
  reportName: string;
  generatedAt: string;
  filters: DashboardFilters;
  data: any[];
  summary: {
    totalRecords: number;
    totalAmount: number;
    averageAmount: number;
  };
}