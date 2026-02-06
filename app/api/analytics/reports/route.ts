import { prisma } from '@/lib/prisma';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const days = parseInt(searchParams.get('days') || '30');
    const companyId = searchParams.get('company_id') || undefined;
    const startDateParam = searchParams.get('from');
    const endDateParam = searchParams.get('to');

    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam 
      ? new Date(startDateParam) 
      : new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const companyFilter = companyId ? { id: companyId } : {};

    let data: any[] = [];
    let summary = { totalRecords: 0, totalAmount: 0, averageAmount: 0 };

    switch (type) {
      case 'revenue':
        const payments = await prisma.payment.findMany({
          where: {
            ...companyFilter,
            createdAt: { gte: startDate, lte: endDate },
            OR: [
              { status: 'paid' },
              { substatus: 'succeeded' },
              { substatus: 'resolution_won' }
            ]
          },
          include: { user: true },
          orderBy: { createdAt: 'desc' }
        });

        const sheetData = await prisma.sheetData.findMany({
          where: {
            ...companyFilter,
            date: { gte: startDate, lte: endDate }
          },
          orderBy: { date: 'desc' }
        });

        const electiveData = await prisma.electiveData.findMany({
          where: {
            ...companyFilter,
            saleDate: { gte: startDate, lte: endDate }
          },
          orderBy: { saleDate: 'desc' }
        });

        const fanbasisData = await prisma.fanbasisData.findMany({
          where: {
            date: { gte: startDate, lte: endDate }
          },
          orderBy: { date: 'desc' }
        });

        data = [
          ...payments.map(p => ({
            source: 'Whop',
            date: p.createdAt.toISOString(),
            customerEmail: p.user?.email || '',
            customerName: p.user?.name || '',
            amount: p.amount,
            fees: p.amountBeforeFees - p.amount,
            netAmount: p.amount - p.refundedAmount,
            status: p.status,
            substatus: p.substatus,
            refundedAmount: p.refundedAmount
          })),
          ...electiveData.map(e => ({
            source: 'Elective',
            date: e.saleDate.toISOString(),
            customerEmail: e.customerEmail,
            customerName: e.customerName || '',
            amount: e.netAmount,
            fees: 0,
            netAmount: e.netAmount,
            status: 'completed',
            substatus: null,
            refundedAmount: 0
          })),
          ...fanbasisData.map(f => ({
            source: 'Fanbasis',
            date: f.date.toISOString(),
            customerEmail: f.customerEmail,
            customerName: f.customerName || '',
            amount: f.netAmount,
            fees: 0,
            netAmount: f.netAmount,
            status: f.status,
            substatus: null,
            refundedAmount: 0
          }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Calculate total using netAmount (same as dashboard: amount - refundedAmount)
        const totalNetAmount = data.reduce((sum, d) => sum + d.netAmount, 0);
        
        summary = {
          totalRecords: data.length,
          totalAmount: totalNetAmount,
          averageAmount: data.length > 0 ? totalNetAmount / data.length : 0
        };
        break;

      case 'payments':
        const allPayments = await prisma.payment.findMany({
          where: {
            ...companyFilter,
            createdAt: { gte: startDate, lte: endDate },
            OR: [
              { status: 'paid' },
              { substatus: 'succeeded' },
              { substatus: 'resolution_won' }
            ]
          },
          include: { user: true },
          orderBy: { createdAt: 'desc' }
        });

        data = allPayments.map(p => ({
          date: p.createdAt.toISOString(),
          customerEmail: p.user?.email || '',
          customerName: p.user?.name || '',
          amount: p.amount,
          amountBeforeFees: p.amountBeforeFees,
          currency: p.currency,
          status: p.status,
          substatus: p.substatus,
          refundedAmount: p.refundedAmount,
          netAmount: p.amount - p.refundedAmount
        }));

        summary = {
          totalRecords: data.length,
          totalAmount: data.reduce((sum, d) => sum + d.netAmount, 0),
          averageAmount: data.length > 0 ? data.reduce((sum, d) => sum + d.netAmount, 0) / data.length : 0
        };
        break;

      case 'memberships':
        const memberships = await prisma.membership.findMany({
          where: {
            ...companyFilter,
            createdAt: { gte: startDate, lte: endDate }
          },
          include: { user: true },
          orderBy: { createdAt: 'desc' }
        });

        data = memberships.map(m => ({
          date: m.createdAt.toISOString(),
          customerEmail: m.user?.email || '',
          customerName: m.user?.name || '',
          productName: m.productName || '',
          status: m.status,
          whopId: m.whopId || ''
        }));

        summary = {
          totalRecords: data.length,
          totalAmount: 0,
          averageAmount: 0
        };
        break;

      case 'appointments':
        const appointments = await prisma.ghlAppointment.findMany({
          where: {
            ...companyFilter,
            startTime: { gte: startDate, lte: endDate }
          },
          include: { contact: true },
          orderBy: { startTime: 'desc' }
        });

        data = appointments.map(a => ({
          date: a.startTime.toISOString(),
          title: a.title || '',
          contactEmail: a.contact?.email || '',
          contactName: `${a.contact?.firstName || ''} ${a.contact?.lastName || ''}`.trim(),
          status: a.status || '',
          startTime: a.startTime.toISOString(),
          endTime: a.endTime?.toISOString() || '',
          assignedTo: a.assignedTo || ''
        }));

        summary = {
          totalRecords: data.length,
          totalAmount: 0,
          averageAmount: 0
        };
        break;

      case 'users':
        const users = await prisma.user.findMany({
          where: companyFilter,
          include: {
            payments: { where: { createdAt: { gte: startDate, lte: endDate } } },
            memberships: { where: { createdAt: { gte: startDate, lte: endDate } } }
          },
          orderBy: { createdAt: 'desc' }
        });

        data = users.map(u => {
          const totalSpent = u.payments
            .filter(p => p.status === 'paid' || p.substatus === 'succeeded')
            .reduce((sum, p) => sum + (p.amount - p.refundedAmount), 0);

          return {
            date: u.createdAt.toISOString(),
            email: u.email,
            name: u.name || '',
            username: u.username || '',
            totalPayments: u.payments.length,
            totalSpent,
            activeMemberships: u.memberships.filter(m => m.status === 'active').length,
            whopId: u.whopId || ''
          };
        });

        summary = {
          totalRecords: data.length,
          totalAmount: data.reduce((sum, d) => sum + d.totalSpent, 0),
          averageAmount: data.length > 0 ? data.reduce((sum, d) => sum + d.totalSpent, 0) / data.length : 0
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    return NextResponse.json({
      type,
      generatedAt: new Date().toISOString(),
      filters: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        companyId
      },
      data,
      summary
    });
  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}