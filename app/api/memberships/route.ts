import { prisma } from '@/lib/prisma';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('company_id') || undefined;

    const memberships = await prisma.membership.findMany({
      where: companyId ? { companyId } : {},
      include: {
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedMemberships = memberships.map(m => ({
      id: m.id,
      status: m.status,
      created_at: m.createdAt.toISOString(),
      product: {
        title: m.productName
      },
      user: {
        id: m.user.whopId,
        email: m.user.email,
        name: m.user.name,
        username: m.user.username
      }
    }));

    return NextResponse.json(formattedMemberships);
  } catch (error: any) {
    console.error('Error fetching memberships from DB:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
