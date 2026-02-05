import { prisma } from '@/lib/prisma';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('company_id') || undefined;

    const users = await prisma.user.findMany({
      where: companyId ? { companyId } : {},
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedMembers = users.map(u => ({
      id: u.id,
      user: {
        id: u.whopId,
        email: u.email,
        name: u.name,
        username: u.username
      },
      email: u.email,
      name: u.name,
      username: u.username,
      joined_at: u.createdAt.toISOString()
    }));

    return NextResponse.json(formattedMembers);
  } catch (error: any) {
    console.error('Error fetching members from DB:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
