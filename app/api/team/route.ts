import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch unique closers and setters from SheetData
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role'); // 'closer', 'setter', or 'all'
    const companyId = searchParams.get('companyId') || 'default';

    // Get all sheet data to extract unique closers and setters
    const sheetData = await prisma.sheetData.findMany({
      where: { companyId },
      orderBy: { date: 'desc' },
    });

    // Build stats maps
    const closerStats = new Map<string, { count: number; amount: number }>();
    const setterStats = new Map<string, { count: number; amount: number }>();

    for (const s of sheetData) {
      if (s.closer) {
        const current = closerStats.get(s.closer) || { count: 0, amount: 0 };
        closerStats.set(s.closer, { count: current.count + 1, amount: current.amount + s.amount });
      }
      if (s.setter) {
        const current = setterStats.get(s.setter) || { count: 0, amount: 0 };
        setterStats.set(s.setter, { count: current.count + 1, amount: current.amount + s.amount });
      }
    }

    const members: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      isActive: boolean;
      createdAt: string;
      stats: {
        closerCount: number;
        closerAmount: number;
        setterCount: number;
        setterAmount: number;
        totalRevenue: number;
      };
    }> = [];

    if (role === 'closer' || role === 'all') {
      for (const [name, stats] of closerStats) {
        members.push({
          id: `closer-${name}`,
          name,
          email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          role: 'closer',
          isActive: true,
          createdAt: new Date().toISOString(),
          stats: {
            closerCount: stats.count,
            closerAmount: stats.amount,
            setterCount: 0,
            setterAmount: 0,
            totalRevenue: stats.amount,
          },
        });
      }
    }

    if (role === 'setter' || role === 'all') {
      for (const [name, stats] of setterStats) {
        members.push({
          id: `setter-${name}`,
          name,
          email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          role: 'setter',
          isActive: true,
          createdAt: new Date().toISOString(),
          stats: {
            closerCount: 0,
            closerAmount: 0,
            setterCount: stats.count,
            setterAmount: stats.amount,
            totalRevenue: stats.amount,
          },
        });
      }
    }

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching team data:', error);
    return NextResponse.json({ error: 'Failed to fetch team data' }, { status: 500 });
  }
}