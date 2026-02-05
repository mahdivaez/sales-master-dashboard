import { prisma } from '@/lib/prisma';
import { UnifiedUser, DashboardData } from '@/types';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = searchParams.get('days');
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const companyId = searchParams.get('company_id') || undefined;

    let startDate: Date;
    let endDate: Date = new Date();

    if (fromParam) {
      startDate = new Date(fromParam);
      if (toParam) {
        endDate = new Date(toParam);
      }
    } else {
      const daysNum = parseInt(days || '30');
      startDate = new Date();
      startDate.setDate(startDate.getDate() - daysNum);
    }

    // Fetch data from database
    const dbUsers = await prisma.user.findMany({
      where: companyId ? { companyId } : {},
      include: {
        payments: {
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
        memberships: {
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
    });

    const users: UnifiedUser[] = dbUsers.map(u => {
      const totalSpent = u.payments.reduce((sum, p) => {
        if (p.status === 'paid' || p.substatus === 'succeeded' || p.substatus === 'resolution_won') {
          return sum + (p.amount - p.refundedAmount);
        }
        return sum;
      }, 0);

      const totalSpentBeforeFees = u.payments.reduce((sum, p) => {
        if (p.status === 'paid' || p.substatus === 'succeeded' || p.substatus === 'resolution_won') {
          return sum + (p.amountBeforeFees - p.refundedAmount);
        }
        return sum;
      }, 0);

      return {
        id: u.id,
        email: u.email,
        name: u.name || 'Unknown',
        username: u.username || 'Unknown',
        memberships: u.memberships.map(m => ({
          id: m.id,
          status: m.status,
          created_at: m.createdAt.toISOString(),
          product: { title: m.productName || 'Unknown' }
        })) as any,
        payments: u.payments.map(p => ({
          id: p.id,
          status: p.status,
          substatus: p.substatus,
          amount_after_fees: p.amount,
          usd_total: p.amountBeforeFees,
          refunded_amount: p.refundedAmount,
          created_at: p.createdAt.toISOString(),
        })) as any,
        totalSpent,
        totalSpentBeforeFees,
      };
    });

    // Filter users who have activity in the range
    const filteredUsersList = users.filter(u => u.payments.length > 0 || u.memberships.length > 0);

    const totalRevenue = filteredUsersList.reduce((sum, u) => sum + u.totalSpent, 0);
    const totalRevenueBeforeFees = filteredUsersList.reduce((sum, u) => sum + u.totalSpentBeforeFees, 0);
    
    const activeMemberships = filteredUsersList.reduce((sum, u) => {
      return sum + u.memberships.filter((m: any) => m.status === 'active' || m.status === 'trialing' || m.status === 'completed').length;
    }, 0);

    const totalUsers = filteredUsersList.length;
    const arpu = totalUsers > 0 ? totalRevenue / totalUsers : 0;

    // Sort users by newest payment date
    filteredUsersList.sort((a, b) => {
      const lastA = a.payments.length > 0 ? new Date(a.payments[0].created_at).getTime() : 0;
      const lastB = b.payments.length > 0 ? new Date(b.payments[0].created_at).getTime() : 0;
      return lastB - lastA;
    });

    // Calculate Revenue Trend
    const dailyRevenue: Record<string, { amount: number; amountBeforeFees: number }> = {};
    filteredUsersList.forEach(u => {
      u.payments.forEach((p: any) => {
        const date = new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!dailyRevenue[date]) {
          dailyRevenue[date] = { amount: 0, amountBeforeFees: 0 };
        }
        dailyRevenue[date].amount += (p.amount_after_fees - p.refunded_amount);
        dailyRevenue[date].amountBeforeFees += (p.usd_total - p.refunded_amount);
      });
    });

    const revenueTrend = Object.entries(dailyRevenue)
      .map(([date, data]) => ({ date, amount: data.amount, amountBeforeFees: data.amountBeforeFees }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const dashboardData: DashboardData = {
      users: filteredUsersList,
      totalRevenue,
      totalRevenueBeforeFees,
      activeMemberships,
      totalUsers,
      arpu,
      revenueTrend
    };

    return NextResponse.json(dashboardData);
  } catch (error: any) {
    console.error('Error fetching dashboard data from DB:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
