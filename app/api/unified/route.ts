import { prisma } from '@/lib/prisma';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('company_id') || undefined;

    // Build where clause for company filtering
    const userWhere = companyId ? { companyId } : {};

    // Fetch all users with their related data
    const dbUsers = await prisma.user.findMany({
      where: userWhere,
      include: {
        payments: true,
        memberships: true,
        ghlContact: {
          include: {
            appointments: true,
            opportunities: true,
          },
        },
        sheetData: true,
        electiveData: true,
        fanbasisData: true,
      },
    });

    // Build unified users
    const unifiedUsers = dbUsers.map((user) => {
      const userSheetData = user.sheetData || [];
      const userElectiveData = user.electiveData || [];
      const userFanbasisData = user.fanbasisData || [];
      const ghlContact = user.ghlContact;

      // Calculate total spent from each source
      const totalSpentWhop = user.payments
        .filter((p) => p.status === 'paid' || p.substatus === 'succeeded' || p.substatus === 'resolution_won')
        .reduce((sum, p) => sum + (p.amount - p.refundedAmount), 0);

      const totalSpentSheet = userSheetData.reduce((sum, s) => sum + (s.amount || 0), 0);
      const totalSpentElective = userElectiveData.reduce((sum, e) => sum + (e.netAmount || 0), 0);
      const totalSpentFanbasis = userFanbasisData.reduce((sum, f) => sum + (f.netAmount || 0), 0);

      // Get last payment date
      const sortedPayments = [...user.payments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const lastPayment = sortedPayments[0];
      const lastPaymentDate = lastPayment ? lastPayment.createdAt.toISOString() : undefined;

      // Determine companies/sources
      const companies: string[] = [];
      if (user.payments.length > 0 || user.memberships.length > 0) {
        companies.push('AI CEOS');
      }
      if (userSheetData.length > 0) {
        companies.push('Sheet');
      }
      if (userElectiveData.length > 0) {
        companies.push('Elective');
      }
      if (userFanbasisData.length > 0) {
        companies.push('Fanbasis');
      }
      if (ghlContact) {
        companies.push('GHL');
      }

      // Build GHL data
      const ghlData = ghlContact ? {
        id: ghlContact.id,
        contact: {
          phone: ghlContact.phone,
          tags: ghlContact.tags,
          dateAdded: ghlContact.createdAt.toISOString(),
        },
        opportunities: ghlContact.opportunities.map((opp) => ({
          id: opp.id,
          name: opp.name,
          status: opp.status,
          monetaryValue: opp.monetaryValue,
          pipelineId: opp.pipelineId,
          stageId: opp.stageId,
        })),
        appointments: ghlContact.appointments.map((appt) => ({
          id: appt.id,
          title: appt.title,
          appointmentStatus: appt.status,
          startTime: appt.startTime.toISOString(),
          endTime: appt.endTime?.toISOString(),
        })),
      } : null;

      return {
        email: user.email,
        name: user.name || undefined,
        username: user.username || undefined,
        whopId: user.whopId || undefined,
        totalSpentWhop,
        totalSpentSheet,
        totalSpentElective,
        totalSpentFanbasis,
        lastPaymentDate,
        companies,
        whopData: {
          payments: user.payments.map((p) => ({
            id: p.id,
            status: p.status,
            substatus: p.substatus,
            amount: p.amount,
            amount_after_fees: p.amount,
            usd_total: p.amountBeforeFees,
            refunded_amount: p.refundedAmount,
            created_at: p.createdAt.toISOString(),
          })),
          memberships: user.memberships.map((m) => ({
            id: m.id,
            status: m.status,
            created_at: m.createdAt.toISOString(),
            product: { title: m.productName || 'Unknown' },
          })),
        },
        sheetData: userSheetData.map((s) => ({
          id: s.id,
          amount: s.amount,
          date: s.date.toISOString(),
          closer: s.closer,
          setter: s.setter,
          platform: s.platform,
          type: s.type,
          contactName: s.contactName,
          contactEmail: s.contactEmail,
        })),
        electiveData: userElectiveData.map((e) => ({
          id: e.id,
          netAmount: e.netAmount,
          saleDate: e.saleDate.toISOString(),
          customerName: e.customerName,
          customerEmail: e.customerEmail,
        })),
        fanbasisData: userFanbasisData.map((f) => ({
          id: f.id,
          amount: f.amount,
          netAmount: f.netAmount,
          date: f.date.toISOString(),
          product: f.product,
          customerName: f.customerName,
          status: f.status,
          paymentMethod: f.paymentMethod,
        })),
        ghlData,
        pipelineData: ghlData?.opportunities || [],
      };
    });

    // Filter users who have activity in any source
    const activeUsers = unifiedUsers.filter(
      (u) =>
        u.totalSpentWhop > 0 ||
        u.totalSpentSheet > 0 ||
        u.totalSpentElective > 0 ||
        u.totalSpentFanbasis > 0 ||
        (u.ghlData && (u.ghlData.opportunities?.length > 0 || u.ghlData.appointments?.length > 0))
    );

    return NextResponse.json({ users: activeUsers });
  } catch (error: any) {
    console.error('Error fetching unified users:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}