import { getMemberships } from '@/lib/whop/fetchers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const memberships = await getMemberships();
    return NextResponse.json(memberships);
  } catch (error: any) {
    console.error('Error fetching memberships:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}