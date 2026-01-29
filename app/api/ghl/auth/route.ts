import { NextRequest, NextResponse } from 'next/server';
import { generatePKCE, getAuthUrl } from '@/lib/ghl-client';

export async function GET(request: NextRequest) {
  const { verifier, challenge } = generatePKCE();
  
  const authUrl = getAuthUrl(challenge);
  
  const response = NextResponse.redirect(authUrl);
  
  // Store verifier in a cookie for the callback
  response.cookies.set('ghl_verifier', verifier, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600 // 10 minutes
  });
  
  return response;
}
