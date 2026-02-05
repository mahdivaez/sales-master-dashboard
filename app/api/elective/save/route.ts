import { prisma } from '@/lib/prisma';
import { NextResponse, NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { data, companyId } = await req.json();

    if (!data || !Array.isArray(data) || !companyId) {
      return NextResponse.json({ error: 'Invalid data or companyId' }, { status: 400 });
    }

    console.log(`Saving ${data.length} elective records for company ${companyId}...`);

    // Clear existing elective data for this company
    await prisma.electiveData.deleteMany({
      where: { companyId }
    });

    for (const row of data) {
      const email = (row.customerEmail || '').toLowerCase().trim();
      if (!email) continue;

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { email_companyId: { email, companyId } }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: row.customerName || 'Unknown',
            companyId
          }
        });
      }

      await prisma.electiveData.create({
        data: {
          saleDate: new Date(row.saleDate),
          customerName: row.customerName,
          customerEmail: email,
          netAmount: parseFloat(row.netAmount) || 0,
          userId: user.id,
          companyId
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Elective save error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
