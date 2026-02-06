import { prisma } from '@/lib/prisma';
import { NextResponse, NextRequest } from 'next/server';

// POST - Sync closers and setters from sheet data with their stats
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyId } = body;

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    // Fetch all sheet data with all fields needed for calculations
    const sheetData = await prisma.sheetData.findMany({
      where: { companyId },
      select: {
        closer: true,
        setter: true,
        amount: true,
        type: true,
      },
    });

    // Calculate stats for each closer
    const closerStats: { [name: string]: { totalRevenue: number; totalSales: number } } = {};
    // Calculate stats for each setter
    const setterStats: { [name: string]: { totalRevenue: number; totalSales: number } } = {};

    sheetData.forEach((row) => {
      // Calculate closer stats
      if (row.closer) {
        if (!closerStats[row.closer]) {
          closerStats[row.closer] = { totalRevenue: 0, totalSales: 0 };
        }
        // Only count positive amounts as revenue (exclude refunds)
        if (row.amount > 0) {
          closerStats[row.closer].totalRevenue += row.amount;
        }
        // Count sales (only positive amounts, exclude refunds)
        if (row.amount > 0 && row.type === 'Sales') {
          closerStats[row.closer].totalSales += 1;
        }
      }

      // Calculate setter stats
      if (row.setter) {
        if (!setterStats[row.setter]) {
          setterStats[row.setter] = { totalRevenue: 0, totalSales: 0 };
        }
        // Only count positive amounts as revenue (exclude refunds)
        if (row.amount > 0) {
          setterStats[row.setter].totalRevenue += row.amount;
        }
        // Count sales (only positive amounts, exclude refunds)
        if (row.amount > 0 && row.type === 'Sales') {
          setterStats[row.setter].totalSales += 1;
        }
      }
    });

    // Get existing closers and setters from database
    const existingClosers = await prisma.closer.findMany({
      where: { companyId },
      select: { id: true, name: true },
    });

    const existingSetters = await prisma.setter.findMany({
      where: { companyId },
      select: { id: true, name: true },
    });

    const existingCloserMap = new Map(existingClosers.map((c) => [c.name, c]));
    const existingSetterMap = new Map(existingSetters.map((s) => [s.name, s]));

    // Get all unique closer and setter names from sheet data
    const uniqueCloserNames = Object.keys(closerStats);
    const uniqueSetterNames = Object.keys(setterStats);

    // Upsert closers
    let closersCreated = 0;
    let closersUpdated = 0;
    for (const name of uniqueCloserNames) {
      const stats = closerStats[name];
      const existingCloser = existingCloserMap.get(name);

      if (existingCloser) {
        // Update existing closer
        await prisma.closer.update({
          where: { id: existingCloser.id },
          data: {
            totalRevenue: stats.totalRevenue,
            totalSales: stats.totalSales,
            isActive: true,
          },
        });
        closersUpdated++;
      } else {
        // Create new closer
        await prisma.closer.create({
          data: {
            name,
            companyId,
            totalRevenue: stats.totalRevenue,
            totalSales: stats.totalSales,
            isActive: true,
          },
        });
        closersCreated++;
      }
    }

    // Upsert setters
    let settersCreated = 0;
    let settersUpdated = 0;
    for (const name of uniqueSetterNames) {
      const stats = setterStats[name];
      const existingSetter = existingSetterMap.get(name);

      if (existingSetter) {
        // Update existing setter
        await prisma.setter.update({
          where: { id: existingSetter.id },
          data: {
            totalRevenue: stats.totalRevenue,
            totalSales: stats.totalSales,
            isActive: true,
          },
        });
        settersUpdated++;
      } else {
        // Create new setter
        await prisma.setter.create({
          data: {
            name,
            companyId,
            totalRevenue: stats.totalRevenue,
            totalSales: stats.totalSales,
            isActive: true,
          },
        });
        settersCreated++;
      }
    }

    // Get total counts
    const totalClosers = await prisma.closer.count({ where: { companyId } });
    const totalSetters = await prisma.setter.count({ where: { companyId } });

    return NextResponse.json({
      success: true,
      summary: {
        totalClosers,
        totalSetters,
        closersCreated,
        closersUpdated,
        settersCreated,
        settersUpdated,
        closers: uniqueCloserNames,
        setters: uniqueSetterNames,
      },
    });
  } catch (error: any) {
    console.error('Error syncing closers/setters:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - Get sync status
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('company_id');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    // Get counts
    const [closersCount, settersCount, sheetDataCount] = await Promise.all([
      prisma.closer.count({ where: { companyId } }),
      prisma.setter.count({ where: { companyId } }),
      prisma.sheetData.count({ where: { companyId } }),
    ]);

    // Get unique closers/setters from sheet data
    const sheetData = await prisma.sheetData.findMany({
      where: { companyId },
      select: { closer: true, setter: true },
    });

    const uniqueClosers = new Set(sheetData.map((s) => s.closer).filter(Boolean));
    const uniqueSetters = new Set(sheetData.map((s) => s.setter).filter(Boolean));

    return NextResponse.json({
      inDatabase: {
        closers: closersCount,
        setters: settersCount,
      },
      inSheetData: {
        uniqueClosers: uniqueClosers.size,
        uniqueSetters: uniqueSetters.size,
      },
      sheetDataCount,
      needsSync: closersCount === 0 || settersCount === 0,
    });
  } catch (error: any) {
    console.error('Error getting sync status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}