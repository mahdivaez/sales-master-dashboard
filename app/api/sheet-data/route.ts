import { prisma } from '@/lib/prisma';
import { NextResponse, NextRequest } from 'next/server';

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, closer, setter } = body;

    if (!id) {
      return NextResponse.json({ error: 'Sheet data ID is required' }, { status: 400 });
    }

    // Get the current sheet data to find companyId
    const currentData = await prisma.sheetData.findUnique({
      where: { id },
      select: { companyId: true }
    });

    if (!currentData) {
      return NextResponse.json({ error: 'Sheet data not found' }, { status: 404 });
    }

    const updateData: any = {};
    
    if (closer !== undefined) {
      updateData.closer = closer;
      if (closer) {
        // Find or create the closer in the Closer table
        const closerRecord = await prisma.closer.upsert({
          where: {
            name_companyId: {
              name: closer,
              companyId: currentData.companyId,
            },
          },
          update: {},
          create: {
            name: closer,
            companyId: currentData.companyId,
          },
        });
        updateData.closerId = closerRecord.id;
      } else {
        updateData.closerId = null;
      }
    }

    if (setter !== undefined) {
      updateData.setter = setter;
      if (setter) {
        // Find or create the setter in the Setter table
        const setterRecord = await prisma.setter.upsert({
          where: {
            name_companyId: {
              name: setter,
              companyId: currentData.companyId,
            },
          },
          update: {},
          create: {
            name: setter,
            companyId: currentData.companyId,
          },
        });
        updateData.setterId = setterRecord.id;
      } else {
        updateData.setterId = null;
      }
    }

    // Update the sheet data record
    const updatedSheetData = await prisma.sheetData.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updatedSheetData });
  } catch (error: any) {
    console.error('Error updating sheet data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('company_id');
    const includeData = searchParams.get('include_data') === 'true';

    // Get all sheet data
    const sheetData = await prisma.sheetData.findMany({
      where: companyId ? { companyId } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    // Get unique closers and setters
    const closers = new Set<string>();
    const setters = new Set<string>();

    sheetData.forEach((row) => {
      if (row.closer) closers.add(row.closer);
      if (row.setter) setters.add(row.setter);
    });

    if (includeData) {
      return NextResponse.json({
        data: sheetData,
        closers: Array.from(closers).sort(),
        setters: Array.from(setters).sort(),
      });
    }

    return NextResponse.json({
      closers: Array.from(closers).sort(),
      setters: Array.from(setters).sort(),
    });
  } catch (error: any) {
    console.error('Error fetching sheet data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}