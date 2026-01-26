import { NextResponse } from 'next/server';

export async function GET() {
  const html = `
<!DOCTYPE html>
<html>
<body>
<script>
sessionStorage.removeItem('ghl_access_token');
sessionStorage.removeItem('ghl_refresh_token');
sessionStorage.removeItem('ghl_code_verifier');
window.location.href = '/ghl-test';
</script>
</body>
</html>
`;
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}