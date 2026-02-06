import { prisma } from '@/lib/prisma';
import { NextResponse, NextRequest } from 'next/server';

// GET - Fetch all closers
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('company_id');
    const activeOnly = searchParams.get('active_only') === 'true';

    const where: any = {};
    if (companyId) {
      where.companyId = companyId;
    }
    if (activeOnly) {
      where.isActive = true;
    }

    const closers = await prisma.closer.findMany({
      where,
      include: {
        sheetData: { select: { amount: true } },
        electiveData: { select: { netAmount: true } },
        fanbasisData: { select: { netAmount: true } },
      },
      orderBy: { name: 'asc' },
    });

    const closersWithStats = closers.map(c => {
      const sheetRev = c.sheetData.reduce((sum, s) => sum + (s.amount || 0), 0);
      const electiveRev = c.electiveData.reduce((sum, e) => sum + (e.netAmount || 0), 0);
      const fanbasisRev = c.fanbasisData.reduce((sum, f) => sum + (f.netAmount || 0), 0);
      
      return {
        ...c,
        totalRevenue: sheetRev + electiveRev + fanbasisRev,
        totalSales: c.sheetData.length + c.electiveData.length + c.fanbasisData.length
      };
    });

    return NextResponse.json({ closers: closersWithStats });
  } catch (error: any) {
    console.error('Error fetching closers:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create a new closer
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, companyId } = body;

    if (!name || !companyId) {
      return NextResponse.json({ error: 'Name and companyId are required' }, { status: 400 });
    }

    const closer = await prisma.closer.create({
      data: {
        name,
        email,
        phone,
        companyId,
      },
    });

    return NextResponse.json({ success: true, closer });
  } catch (error: any) {
    console.error('Error creating closer:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update a closer
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, email, phone, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Closer ID is required' }, { status: 400 });
    }

    const closer = await prisma.closer.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ success: true, closer });
  } catch (error: any) {
    console.error('Error updating closer:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete a closer
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Closer ID is required' }, { status: 400 });
    }

    await prisma.closer.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting closer:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}