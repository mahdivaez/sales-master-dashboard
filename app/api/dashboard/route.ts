import { getMemberships, getPayments, getMembers } from '@/lib/whop/fetchers';
import { WhopMembership, WhopPayment, UnifiedUser, DashboardData } from '@/types';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = searchParams.get('days');
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const companyId = searchParams.get('company_id') || undefined;

    const [memberships, payments, members] = await Promise.all([
      getMemberships(companyId).catch(e => { console.error('Memberships fetch failed:', e); return []; }),
      getPayments(companyId).catch(e => { console.error('Payments fetch failed:', e); return []; }),
      getMembers(companyId).catch(e => { console.error('Members fetch failed:', e); return []; })
    ]);

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

    // Group by email
    const usersMap = new Map<string, UnifiedUser>();

    // Process members first (most reliable for user info)
    members.forEach((m: any) => {
      const email = m.email || m.user?.email;
      if (!email) return;
      const name = m.name && m.name !== 'Unknown' ? m.name : (m.user?.name || m.username || m.user?.username || 'Unknown');
      
      if (!usersMap.has(email)) {
        usersMap.set(email, {
          id: m.id || m.user?.id,
          email: email,
          name: name,
          username: m.username || m.user?.username,
          memberships: [],
          payments: [],
          totalSpent: 0,
          totalSpentBeforeFees: 0
        });
      }
    });

    // Process memberships to identify users
    memberships.forEach((m: any) => {
      const userObj = m.user || {};
      const email = userObj.email || m.email;
      if (!email) return;
      const name = userObj.name && userObj.name !== 'Unknown' ? userObj.name : (userObj.username || 'Unknown');
      
      if (!usersMap.has(email)) {
        usersMap.set(email, {
          id: userObj.id,
          email: email,
          name: name,
          username: userObj.username,
          memberships: [],
          payments: [],
          totalSpent: 0,
          totalSpentBeforeFees: 0
        });
      } else {
        const user = usersMap.get(email)!;
        if (name && (user.name === 'Unknown' || !user.name)) {
          user.name = name;
        }
      }
      usersMap.get(email)!.memberships.push(m);
    });

    // Process payments and link to users
    payments.forEach((p: any) => {
      const userObj = p.user || {};
      const email = typeof userObj === 'string' ? null : userObj.email;
      if (!email) return;
      const name = userObj.name && userObj.name !== 'Unknown' ? userObj.name : (userObj.username || 'Unknown');

      if (usersMap.has(email)) {
        const user = usersMap.get(email)!;
        user.payments.push(p);
        if (p.status === 'paid' || p.substatus === 'succeeded' || p.substatus === 'resolution_won') {
          const amount = p.amount_after_fees || p.usd_total || (p.total ? parseFloat(p.total) : 0);
          const amountBefore = p.usd_total || (p.total ? parseFloat(p.total) : 0);
          const refunded = p.refunded_amount || 0;
          user.totalSpent += (amount - refunded);
          user.totalSpentBeforeFees += (amountBefore - refunded);
        }
        if (name && (user.name === 'Unknown' || !user.name)) {
          user.name = name;
        }
      } else {
        // If user wasn't in memberships, add them from payment
        const isPaid = p.status === 'paid' || p.substatus === 'succeeded' || p.substatus === 'resolution_won';
        const amount = p.amount_after_fees || p.usd_total || (p.total ? parseFloat(p.total) : 0);
        const amountBefore = p.usd_total || (p.total ? parseFloat(p.total) : 0);
        const refunded = p.refunded_amount || 0;

        usersMap.set(email, {
          id: userObj.id,
          email: email,
          name: name,
          username: userObj.username,
          memberships: [],
          payments: [p],
          totalSpent: isPaid ? (amount - refunded) : 0,
          totalSpentBeforeFees: isPaid ? (amountBefore - refunded) : 0
        });
      }
    });

    const users = Array.from(usersMap.values());

    // Calculate Stats based on date range
    const filteredPayments = payments.filter((p: any) => 
      (p.status === 'paid' || p.substatus === 'succeeded' || p.substatus === 'resolution_won') && 
      new Date(p.created_at) >= startDate && 
      new Date(p.created_at) <= endDate
    );
    
    const totalRevenue = filteredPayments.reduce((sum: number, p: any) => {
      const amount = p.amount_after_fees || p.usd_total || (p.total ? parseFloat(p.total) : 0);
      const refunded = p.refunded_amount || 0;
      return sum + (amount - refunded);
    }, 0);

    const totalRevenueBeforeFees = filteredPayments.reduce((sum: number, p: any) => {
      const amount = p.usd_total || (p.total ? parseFloat(p.total) : 0);
      const refunded = p.refunded_amount || 0;
      return sum + (amount - refunded);
    }, 0);

    const activeMemberships = memberships.filter((m: any) => 
      (m.status === 'active' || m.status === 'trialing' || m.status === 'completed') && 
      new Date(m.created_at) >= startDate &&
      new Date(m.created_at) <= endDate
    ).length;

    const filteredUsersList = users.filter(u => 
      u.payments.some((p: any) => new Date(p.created_at) >= startDate && new Date(p.created_at) <= endDate) || 
      u.memberships.some((m: any) => new Date(m.created_at) >= startDate && new Date(m.created_at) <= endDate) ||
      (u.payments.length === 0 && u.memberships.length === 0) // Include users with no activity in range if they exist
    );

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
    filteredPayments.forEach((p: any) => {
      const date = new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const amount = p.amount_after_fees || p.usd_total || (p.total ? parseFloat(p.total) : 0);
      const amountBefore = p.usd_total || (p.total ? parseFloat(p.total) : 0);
      const refunded = p.refunded_amount || 0;
      
      if (!dailyRevenue[date]) {
        dailyRevenue[date] = { amount: 0, amountBeforeFees: 0 };
      }
      
      dailyRevenue[date].amount += (amount - refunded);
      dailyRevenue[date].amountBeforeFees += (amountBefore - refunded);
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
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
