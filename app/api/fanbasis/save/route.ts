import { prisma } from '@/lib/prisma';
import { NextResponse, NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { data } = await req.json();

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    console.log(`Saving ${data.length} fanbasis records...`);

    for (const row of data) {
      const email = (row.customerEmail || '').toLowerCase().trim();
      if (!email) continue;

      // Find user by email only (across all companies)
      const existingUser = await prisma.user.findFirst({
        where: { email }
      });

      let user = existingUser;

      if (!user) {
        // Create user with a default company (first company in database)
        const defaultCompany = await prisma.company.findFirst();
        if (!defaultCompany) {
          console.error('No company found in database');
          continue;
        }
        
        user = await prisma.user.create({
          data: {
            email,
            name: row.customerName || 'Unknown',
            companyId: defaultCompany.id
          }
        });
      }

      await prisma.fanbasisData.create({
        data: {
          amount: parseFloat(row.amount) || 0,
          status: row.status,
          date: row.date ? new Date(row.date) : new Date(),
          customerName: row.customerName,
          customerEmail: email,
          product: row.product,
          productId: row.productId,
          discountCode: row.discountCode,
          discountedAmount: parseFloat(row.discountedAmount) || 0,
          saleId: row.saleId,
          netAmount: parseFloat(row.netAmount) || 0,
          paymentMethod: row.paymentMethod,
          availableToWithdraw: row.availableToWithdraw,
          userId: user.id
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Fanbasis save error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}