import { getPayments } from '@/lib/whop/fetchers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const payments = await getPayments();
    return NextResponse.json(payments);
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}