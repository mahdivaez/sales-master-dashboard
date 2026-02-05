import { prisma } from '@/lib/prisma';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('company_id') || undefined;

    const payments = await prisma.payment.findMany({
      where: companyId ? { companyId } : {},
      include: {
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Map back to Whop format for UI compatibility if needed
    const formattedPayments = payments.map(p => ({
      id: p.id,
      status: p.status,
      substatus: p.substatus,
      amount_after_fees: p.amount,
      usd_total: p.amountBeforeFees,
      total: p.amountBeforeFees,
      refunded_amount: p.refundedAmount,
      created_at: p.createdAt.toISOString(),
      user: {
        id: p.user.whopId,
        email: p.user.email,
        name: p.user.name,
        username: p.user.username
      }
    }));

    return NextResponse.json(formattedPayments);
  } catch (error: any) {
    console.error('Error fetching payments from DB:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
