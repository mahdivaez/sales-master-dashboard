import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken } from '@/lib/ghl-client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const verifier = request.cookies.get('ghl_verifier')?.value;

  if (!code || !verifier) {
    return NextResponse.redirect(new URL('/ghl-error?error=missing_params', request.url));
  }

  try {
    const tokenData = await exchangeCodeForToken(code, verifier);
    
    // Redirect to a client-side page that will store the tokens
    // We pass them in the hash or use a temporary session to be safer, 
    // but for this test we'll use a callback page that handles storage.
    const response = NextResponse.redirect(new URL('/ghl/setup', request.url));
    
    // Set tokens in cookies or pass to the setup page
    // For simplicity in this dashboard, we'll use a setup page that reads from a temporary cookie
    response.cookies.set('ghl_temp_data', JSON.stringify(tokenData), {
      maxAge: 60, // 1 minute
      path: '/'
    });
    
    return response;
  } catch (error: any) {
    console.error('GHL Auth Error:', error);
    return NextResponse.redirect(new URL(`/ghl-error?error=${encodeURIComponent(error.message)}`, request.url));
  }
}
