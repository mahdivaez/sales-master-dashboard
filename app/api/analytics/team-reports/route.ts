import { prisma } from '@/lib/prisma';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // 'closer' or 'setter'
    const id = searchParams.get('id');
    const companyId = searchParams.get('company_id');

    if (!type || (type !== 'closer' && type !== 'setter')) {
      return NextResponse.json({ error: 'Valid type (closer or setter) is required' }, { status: 400 });
    }

    if (id) {
      // Fetch individual report
      const model = type === 'closer' ? prisma.closer : prisma.setter;
      const member = await (model as any).findUnique({
        where: { id },
        include: {
          sheetData: true,
          electiveData: true,
          fanbasisData: true,
        }
      });

      if (!member) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 });
      }

      return NextResponse.json({ member });
    } else {
      // Fetch overview report
      const model = type === 'closer' ? prisma.closer : prisma.setter;
      const members = await (model as any).findMany({
        where: companyId ? { companyId } : {},
        include: {
          sheetData: { select: { amount: true } },
          electiveData: { select: { netAmount: true } },
          fanbasisData: { select: { netAmount: true } },
        }
      });

      const report = members.map((m: any) => {
        const sheetRev = m.sheetData.reduce((sum: number, s: any) => sum + (s.amount || 0), 0);
        const electiveRev = m.electiveData.reduce((sum: number, e: any) => sum + (e.netAmount || 0), 0);
        const fanbasisRev = m.fanbasisData.reduce((sum: number, f: any) => sum + (f.netAmount || 0), 0);
        
        return {
          id: m.id,
          name: m.name,
          email: m.email,
          totalRevenue: sheetRev + electiveRev + fanbasisRev,
          salesCount: m.sheetData.length + m.electiveData.length + m.fanbasisData.length,
          breakdown: {
            sheet: sheetRev,
            elective: electiveRev,
            fanbasis: fanbasisRev
          }
        };
      });

      return NextResponse.json({ report });
    }
  } catch (error: any) {
    console.error('Error fetching team reports:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
