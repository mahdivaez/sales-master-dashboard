import { prisma } from '@/lib/prisma';
import { NextResponse, NextRequest } from 'next/server';

// GET - Fetch all setters
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

    const setters = await prisma.setter.findMany({
      where,
      include: {
        sheetData: { select: { amount: true } },
        electiveData: { select: { netAmount: true } },
        fanbasisData: { select: { netAmount: true } },
      },
      orderBy: { name: 'asc' },
    });

    const settersWithStats = setters.map(s => {
      const sheetRev = s.sheetData.reduce((sum, row) => sum + (row.amount || 0), 0);
      const electiveRev = s.electiveData.reduce((sum, e) => sum + (e.netAmount || 0), 0);
      const fanbasisRev = s.fanbasisData.reduce((sum, f) => sum + (f.netAmount || 0), 0);
      
      return {
        ...s,
        totalRevenue: sheetRev + electiveRev + fanbasisRev,
        totalSales: s.sheetData.length + s.electiveData.length + s.fanbasisData.length
      };
    });

    return NextResponse.json({ setters: settersWithStats });
  } catch (error: any) {
    console.error('Error fetching setters:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create a new setter
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, companyId } = body;

    if (!name || !companyId) {
      return NextResponse.json({ error: 'Name and companyId are required' }, { status: 400 });
    }

    const setter = await prisma.setter.create({
      data: {
        name,
        email,
        phone,
        companyId,
      },
    });

    return NextResponse.json({ success: true, setter });
  } catch (error: any) {
    console.error('Error creating setter:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update a setter
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, email, phone, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Setter ID is required' }, { status: 400 });
    }

    const setter = await prisma.setter.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ success: true, setter });
  } catch (error: any) {
    console.error('Error updating setter:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete a setter
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Setter ID is required', status: 400 });
    }

    await prisma.setter.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting setter:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}