import { generatePKCE, getAuthUrl } from '@/lib/ghl-client';
import { NextResponse } from 'next/server';

export async function GET() {
  const { verifier, challenge } = generatePKCE();
  const authUrl = getAuthUrl(challenge);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set('ghl_code_verifier', verifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600, // 10 minutes
  });

  return response;
}