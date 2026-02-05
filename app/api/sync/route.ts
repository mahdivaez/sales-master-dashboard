import { syncWhop, syncGhl, syncGoogleSheets } from '@/lib/sync';
import { NextResponse, NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    if (type === 'sheets') {
      await syncGoogleSheets();
    } else if (type === 'whop') {
      await syncWhop();
    } else if (type === 'ghl') {
      await syncGhl();
    } else {
      await Promise.all([syncWhop(), syncGhl(), syncGoogleSheets()]);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Sync API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
