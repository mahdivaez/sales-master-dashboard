import { exchangeCodeForToken } from '@/lib/ghl-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'No authorization code' }, { status: 400 });
  }

  const verifier = request.cookies.get('ghl_code_verifier')?.value;
  if (!verifier) {
    return NextResponse.json({ error: 'No code verifier' }, { status: 400 });
  }

  try {
    const tokens = await exchangeCodeForToken(code, verifier);

    const html = `
<!DOCTYPE html>
<html>
<body>
<script>
sessionStorage.setItem('ghl_access_token', '${tokens.access_token}');
sessionStorage.setItem('ghl_refresh_token', '${tokens.refresh_token || ''}');
window.location.href = '/ghl-test';
</script>
</body>
</html>
`;
    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
  } catch (error: any) {
    const html = `
<!DOCTYPE html>
<html>
<body>
<script>
alert('Authentication failed: ${error.message}');
window.location.href = '/ghl-test';
</script>
</body>
</html>
`;
    return new Response(html, { headers: { 'Content-Type': 'text/html' } });
  }
}