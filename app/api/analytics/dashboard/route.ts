import { prisma } from '@/lib/prisma';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = parseInt(searchParams.get('days') || '30');
    const companyId = searchParams.get('company_id') || undefined;
    const startDateParam = searchParams.get('from');
    const endDateParam = searchParams.get('to');

    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Build company filter
    const companyFilter = companyId ? { id: companyId } : {};

    // Fetch all data in parallel
    const [
      payments,
      memberships,
      users,
      sheetData,
      electiveData,
      fanbasisData,
      ghlContacts,
      ghlAppointments,
      ghlOpportunities,
      companies
    ] = await Promise.all([
      prisma.payment.findMany({
        where: {
          ...companyFilter,
          createdAt: { gte: startDate, lte: endDate }
        },
        include: { user: true }
      }),
      prisma.membership.findMany({
        where: {
          ...companyFilter,
          createdAt: { gte: startDate, lte: endDate }
        },
        include: { user: true }
      }),
      prisma.user.findMany({
        where: companyFilter,
        include: {
          payments: { where: { createdAt: { gte: startDate, lte: endDate } } },
          memberships: { where: { createdAt: { gte: startDate, lte: endDate } } }
        }
      }),
      prisma.sheetData.findMany({
        where: {
          ...companyFilter,
          date: { gte: startDate, lte: endDate }
        }
      }),
      prisma.electiveData.findMany({
        where: {
          ...companyFilter,
          saleDate: { gte: startDate, lte: endDate }
        }
      }),
      prisma.fanbasisData.findMany({
        where: {
          ...companyFilter,
          date: { gte: startDate, lte: endDate }
        }
      }),
      prisma.ghlContact.findMany({
        where: { ...companyFilter },
        include: { appointments: true }
      }),
      prisma.ghlAppointment.findMany({
        where: {
          ...companyFilter,
          startTime: { gte: startDate, lte: endDate }
        }
      }),
      prisma.ghlOpportunity.findMany({
        where: { ...companyFilter }
      }),
      prisma.company.findMany({
        where: companyFilter,
        include: {
          ghlPipelines: { include: { stages: true } },
          ghlUsers: true
        }
      })
    ]);

    // Calculate Summary Metrics
    const successfulPayments = payments.filter(p =>
      p.status === 'paid' || p.substatus === 'succeeded' || p.substatus === 'resolution_won'
    );
    const failedPayments = payments.filter(p =>
      p.status === 'failed' || p.substatus === 'failed' || p.status === 'refunded'
    );
    const refundedPayments = payments.filter(p => p.refundedAmount > 0);

    const totalRevenue = successfulPayments.reduce((sum, p) => sum + (p.amount - p.refundedAmount), 0);
    const totalRevenueBeforeFees = successfulPayments.reduce((sum, p) => sum + (p.amountBeforeFees - p.refundedAmount), 0);
    const totalRefundedAmount = payments.reduce((sum, p) => sum + p.refundedAmount, 0);
    
    // ========== ELECTIVE DATA METRICS ==========
    const electiveRevenue = electiveData.reduce((sum, e) => sum + e.netAmount, 0);
    const electiveCount = electiveData.length;
    const electiveAOV = electiveCount > 0 ? electiveRevenue / electiveCount : 0;
    
    // Elective by date for trend
    const electiveByDate: Record<string, number> = {};
    electiveData.forEach(e => {
      const date = e.saleDate.toISOString().split('T')[0];
      electiveByDate[date] = (electiveByDate[date] || 0) + e.netAmount;
    });
    
    const electiveTrend = Object.entries(electiveByDate)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ========== FANBASIS DATA METRICS ==========
    const fanbasisRevenue = fanbasisData.reduce((sum, f) => sum + f.netAmount, 0);
    const fanbasisCount = fanbasisData.length;
    const fanbasisAOV = fanbasisCount > 0 ? fanbasisRevenue / fanbasisCount : 0;
    
    // Fanbasis by status
    const fanbasisByStatus: Record<string, { count: number; amount: number }> = {};
    fanbasisData.forEach(f => {
      const status = f.status || 'unknown';
      if (!fanbasisByStatus[status]) {
        fanbasisByStatus[status] = { count: 0, amount: 0 };
      }
      fanbasisByStatus[status].count++;
      fanbasisByStatus[status].amount += f.netAmount;
    });
    
    const fanbasisStatusData = Object.entries(fanbasisByStatus).map(([status, data]) => ({
      status,
      count: data.count,
      amount: data.amount,
      percentage: fanbasisCount > 0 ? (data.count / fanbasisCount) * 100 : 0
    }));

    // Fanbasis by product
    const fanbasisByProduct: Record<string, { count: number; amount: number }> = {};
    fanbasisData.forEach(f => {
      const product = f.product || 'Unknown';
      if (!fanbasisByProduct[product]) {
        fanbasisByProduct[product] = { count: 0, amount: 0 };
      }
      fanbasisByProduct[product].count++;
      fanbasisByProduct[product].amount += f.netAmount;
    });
    
    const fanbasisProductData = Object.entries(fanbasisByProduct)
      .map(([product, data]) => ({
        product,
        count: data.count,
        amount: data.amount,
        percentage: fanbasisCount > 0 ? (data.count / fanbasisCount) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    // Fanbasis by payment method
    const fanbasisByPaymentMethod: Record<string, number> = {};
    fanbasisData.forEach(f => {
      const method = f.paymentMethod || 'Unknown';
      fanbasisByPaymentMethod[method] = (fanbasisByPaymentMethod[method] || 0) + f.netAmount;
    });
    
    const fanbasisPaymentMethods = Object.entries(fanbasisByPaymentMethod)
      .map(([method, amount]) => ({ method, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Fanbasis discount analysis
    const fanbasisWithDiscount = fanbasisData.filter(f => f.discountCode);
    const fanbasisDiscountTotal = fanbasisWithDiscount.reduce((sum, f) => sum + (f.discountedAmount || 0), 0);
    const fanbasisOriginalTotal = fanbasisWithDiscount.reduce((sum, f) => sum + f.amount, 0);
    const fanbasisDiscountSavings = fanbasisOriginalTotal - fanbasisDiscountTotal;

    // Fanbasis by date for trend
    const fanbasisByDate: Record<string, number> = {};
    fanbasisData.forEach(f => {
      const date = f.date.toISOString().split('T')[0];
      fanbasisByDate[date] = (fanbasisByDate[date] || 0) + f.netAmount;
    });
    
    const fanbasisTrend = Object.entries(fanbasisByDate)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate total revenue from ALL sources (Whop payments + Elective Data + Fanbasis Data)
    // Note: SheetData (Cash Collected) is not included as it's just a tracking sheet, not actual money
    const totalRevenueFromAllSources = totalRevenue + electiveRevenue + fanbasisRevenue;

    // Total whop revenue = payments only (no sheet data)
    const whopRevenue = totalRevenue;

    const activeMemberships = memberships.filter(m =>
      m.status === 'active' || m.status === 'trialing' || m.status === 'completed'
    ).length;

    const newUsersInPeriod = users.filter(u =>
      u.createdAt >= startDate && u.createdAt <= endDate
    ).length;

    const uniqueCustomers = new Set([
      ...successfulPayments.map(p => p.userId),
      ...sheetData.map(s => s.userId || s.contactEmail),
      ...electiveData.map(e => e.userId || e.customerEmail),
      ...fanbasisData.map(f => f.userId || f.customerEmail)
    ]).size;

    const arpu = uniqueCustomers > 0 ? totalRevenueFromAllSources / uniqueCustomers : 0;
    
    // AOV should be Total Revenue / Total Number of Sales (Whop + Elective + Fanbasis)
    const totalSalesCount = successfulPayments.length + electiveCount + fanbasisCount;
    const aov = totalSalesCount > 0 ? totalRevenueFromAllSources / totalSalesCount : 0;

    // Revenue by Source for Chart
    const revenueBySource = [
      { name: 'Whop', value: whopRevenue, fill: '#6366f1' },
      { name: 'Elective', value: electiveRevenue, fill: '#f59e0b' },
      { name: 'Fanbasis', value: fanbasisRevenue, fill: '#ec4899' }
    ];

    // Daily Revenue Trend
    const dailyRevenue: Record<string, { whop: number; elective: number; fanbasis: number }> = {};
    
    successfulPayments.forEach(p => {
      const date = p.createdAt.toISOString().split('T')[0];
      if (!dailyRevenue[date]) dailyRevenue[date] = { whop: 0, elective: 0, fanbasis: 0 };
      dailyRevenue[date].whop += (p.amount - p.refundedAmount);
    });


    electiveData.forEach(e => {
      const date = e.saleDate.toISOString().split('T')[0];
      if (!dailyRevenue[date]) dailyRevenue[date] = { whop: 0, elective: 0, fanbasis: 0 };
      dailyRevenue[date].elective += e.netAmount;
    });

    fanbasisData.forEach(f => {
      const date = f.date.toISOString().split('T')[0];
      if (!dailyRevenue[date]) dailyRevenue[date] = { whop: 0, elective: 0, fanbasis: 0 };
      dailyRevenue[date].fanbasis += f.netAmount;
    });

    const revenueTrend = Object.entries(dailyRevenue)
      .map(([date, data]) => ({
        date,
        whopRevenue: data.whop,
        electiveRevenue: data.elective,
        fanbasisRevenue: data.fanbasis,
        totalRevenue: data.whop + data.elective + data.fanbasis
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Payments by Status
    const paymentStatusMap = new Map<string, { count: number; amount: number }>();
    payments.forEach(p => {
      const status = p.status || 'unknown';
      const existing = paymentStatusMap.get(status) || { count: 0, amount: 0 };
      paymentStatusMap.set(status, {
        count: existing.count + 1,
        amount: existing.amount + (p.amount - p.refundedAmount)
      });
    });

    const paymentsByStatus = Array.from(paymentStatusMap.entries()).map(([status, data]) => ({
      status,
      count: data.count,
      amount: data.amount,
      percentage: payments.length > 0 ? (data.count / payments.length) * 100 : 0
    }));

    // Memberships by Status
    const membershipStatusMap = new Map<string, number>();
    memberships.forEach(m => {
      const status = m.status || 'unknown';
      membershipStatusMap.set(status, (membershipStatusMap.get(status) || 0) + 1);
    });

    const membershipsByStatus = Array.from(membershipStatusMap.entries()).map(([status, count]) => ({
      status,
      count,
      percentage: memberships.length > 0 ? (count / memberships.length) * 100 : 0
    }));

    // Top Performers (by revenue)
    const userRevenueMap = new Map<string, { name: string; email: string; revenue: number; count: number }>();
    
    successfulPayments.forEach(p => {
      const existing = userRevenueMap.get(p.userId) || { name: p.user?.name || 'Unknown', email: p.user?.email || '', revenue: 0, count: 0 };
      userRevenueMap.set(p.userId, {
        name: existing.name,
        email: existing.email,
        revenue: existing.revenue + (p.amount - p.refundedAmount),
        count: existing.count + 1
      });
    });

    const topPerformers = Array.from(userRevenueMap.entries())
      .map(([userId, data]) => ({
        userId,
        name: data.name,
        email: data.email,
        totalRevenue: data.revenue,
        paymentCount: data.count,
        averageOrderValue: data.count > 0 ? data.revenue / data.count : 0
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    // Product Performance (from memberships)
    const productMap = new Map<string, { name: string; sales: number; revenue: number }>();
    memberships.forEach(m => {
      const productName = m.productName || 'Unknown';
      const existing = productMap.get(productName) || { name: productName, sales: 0, revenue: 0 };
      productMap.set(productName, {
        name: productName,
        sales: existing.sales + 1,
        revenue: existing.revenue + (m.status === 'active' ? 0 : 0)
      });
    });

    const productPerformance = Array.from(productMap.entries())
      .map(([productId, data]) => ({
        productName: data.name,
        productId,
        totalSales: data.sales,
        totalRevenue: data.revenue,
        averagePrice: data.sales > 0 ? data.revenue / data.sales : 0
      }))
      .sort((a, b) => b.totalSales - a.totalSales);

    // Daily Transactions
    const dailyTransactions: Record<string, number> = {};
    payments.forEach(p => {
      const date = p.createdAt.toISOString().split('T')[0];
      dailyTransactions[date] = (dailyTransactions[date] || 0) + 1;
    });

    const transactionChartData = Object.entries(dailyTransactions)
      .map(([date, count]) => ({ name: date, value: count }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // User Growth
    const userGrowth: Record<string, number> = {};
    users.forEach(u => {
      const date = u.createdAt.toISOString().split('T')[0];
      userGrowth[date] = (userGrowth[date] || 0) + 1;
    });

    const userGrowthChartData = Object.entries(userGrowth)
      .map(([date, count]) => ({ name: date, value: count }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Appointment Stats
    const appointmentStats = {
      total: ghlAppointments.length,
      completed: ghlAppointments.filter(a => a.status === 'completed').length,
      scheduled: ghlAppointments.filter(a => a.status === 'scheduled').length,
      cancelled: ghlAppointments.filter(a => a.status === 'cancelled').length,
      completionRate: ghlAppointments.length > 0
        ? (ghlAppointments.filter(a => a.status === 'completed').length / ghlAppointments.length) * 100
        : 0
    };

    // GHL Pipeline Stats
    const pipelineStats = companies.flatMap(c =>
      c.ghlPipelines.map(p => ({
        pipelineId: p.ghlId,
        pipelineName: p.name,
        stages: p.stages.map(s => ({
          stageId: s.ghlId,
          stageName: s.name,
          count: ghlOpportunities.filter(o => o.stageId === s.ghlId).length,
          value: ghlOpportunities.filter(o => o.stageId === s.ghlId).reduce((sum, o) => sum + (o.monetaryValue || 0), 0)
        }))
      }))
    );

    // Sheet Data Summary (kept for reference but not included in revenue)
    const sheetByPlatform: Record<string, number> = {};
    sheetData.forEach(s => {
      const platform = (s.platform || '').toLowerCase();
      const amount = s.amount;
      if (platform === 'whop' || platform === 'whop.com') {
        sheetByPlatform['whop'] = (sheetByPlatform['whop'] || 0) + amount;
      } else if (platform === 'elective') {
        sheetByPlatform['elective'] = (sheetByPlatform['elective'] || 0) + amount;
      } else if (platform === 'fanbasis') {
        sheetByPlatform['fanbasis'] = (sheetByPlatform['fanbasis'] || 0) + amount;
      }
    });

    const sheetDataSummary = {
      totalRecords: sheetData.length,
      totalAmount: sheetData.reduce((sum, s) => sum + s.amount, 0),
      byPlatform: Object.entries(sheetByPlatform).map(([platform, amount]) => ({
        platform,
        amount,
        count: sheetData.filter(s => (s.platform || '').toLowerCase() === platform.toLowerCase()).length
      })),
      byCloser: sheetData.reduce((acc, s) => {
        const closer = s.closer || 'Unknown';
        if (!acc[closer]) acc[closer] = { count: 0, amount: 0 };
        acc[closer].count++;
        acc[closer].amount += s.amount;
        return acc;
      }, {} as Record<string, { count: number; amount: number }>),
      bySetter: sheetData.reduce((acc, s) => {
        const setter = s.setter || 'Unknown';
        if (!acc[setter]) acc[setter] = { count: 0, amount: 0 };
        acc[setter].count++;
        acc[setter].amount += s.amount;
        return acc;
      }, {} as Record<string, { count: number; amount: number }>)
    };

    // Calculate Whop-only AOV
    const whopAOV = successfulPayments.length > 0 ? whopRevenue / successfulPayments.length : 0;

    // Build response
    const dashboardData = {
      summary: {
        totalRevenue: totalRevenueFromAllSources, // Grand Total from all sources (Whop + Elective + Fanbasis)
        whopRevenue: whopRevenue, // Whop-only revenue (payments)
        totalRevenueBeforeFees,
        netRevenue: totalRevenueFromAllSources, // Net revenue from all sources
        totalPayments: payments.length,
        successfulPayments: successfulPayments.length,
        failedPayments: failedPayments.length,
        refundedPayments: refundedPayments.length,
        totalRefundedAmount,
        activeMemberships,
        totalUsers: users.length,
        newUsers: newUsersInPeriod,
        arpu,
        whopAOV: whopAOV, // Whop-only AOV
        averageOrderValue: aov,
        totalSalesCount: totalSalesCount,
        conversionRate: ghlContacts.length > 0 ? (totalSalesCount / ghlContacts.length) * 100 : 0,
        // Elective Metrics
        electiveRevenue,
        electiveCount,
        electiveAOV,
        // Fanbasis Metrics
        fanbasisRevenue,
        fanbasisCount,
        fanbasisAOV,
        fanbasisDiscountSavings,
        fanbasisWithDiscountCount: fanbasisWithDiscount.length
      },
      revenueTrend,
      paymentsByStatus,
      membershipsByStatus,
      topPerformers,
      productPerformance,
      dailyTransactions: transactionChartData,
      revenueBySource,
      userGrowth: userGrowthChartData,
      appointmentStats,
      // New detailed sections
      electiveData: {
        trend: electiveTrend,
        totalRevenue: electiveRevenue,
        totalCount: electiveCount,
        averageOrderValue: electiveAOV
      },
      fanbasisData: {
        trend: fanbasisTrend,
        totalRevenue: fanbasisRevenue,
        totalCount: fanbasisCount,
        averageOrderValue: fanbasisAOV,
        byStatus: fanbasisStatusData,
        byProduct: fanbasisProductData,
        byPaymentMethod: fanbasisPaymentMethods,
        discountAnalysis: {
          totalDiscounts: fanbasisDiscountTotal,
          totalSavings: fanbasisDiscountSavings,
          discountedOrders: fanbasisWithDiscount.length
        }
      },
      sheetData: sheetDataSummary,
      pipelineStats,
      filters: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        companyId,
        days
      }
    };

    return NextResponse.json(dashboardData);
  } catch (error: any) {
    console.error('Error fetching dashboard analytics:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}