import { getMembers } from '@/lib/whop/fetchers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const members = await getMembers();
    return NextResponse.json(members);
  } catch (error: any) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}