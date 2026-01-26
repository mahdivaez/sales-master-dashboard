import { randomBytes, createHash } from 'crypto';

const GHL_CLIENT_ID = "pit-2649ae7e-b7c9-4422-bcb8-1566ed0c2137"; // TODO: Move to .env
const GHL_AUTH_URL = "https://marketplace.gohighlevel.com/oauth/chooselocation";
const GHL_TOKEN_URL = "https://services.leadconnectorhq.com/oauth/token";
const GHL_API_BASE = "https://rest.gohighlevel.com/v1";

export function generatePKCE() {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

export function getAuthUrl(challenge: string) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: GHL_CLIENT_ID,
    redirect_uri: 'http://localhost:3000/ghl/callback',
    scope: 'businesses.readonly contacts.readonly objects/schema.readonly users.readonly socialplanner/tag.readonly payments.readonly payments/orders.readonly opportunities.readonly funnels/funnel.readonly',
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });
  return `${GHL_AUTH_URL}?${params}`;
}

export async function exchangeCodeForToken(code: string, verifier: string) {
  const response = await fetch(GHL_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: GHL_CLIENT_ID,
      client_secret: process.env.GHL_CLIENT_SECRET!,
      code,
      code_verifier: verifier,
      redirect_uri: 'http://localhost:3000/ghl/callback',
    }),
  });
  if (!response.ok) throw new Error('Token exchange failed');
  return response.json();
}

export async function refreshToken(refreshToken: string) {
  const response = await fetch(GHL_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: GHL_CLIENT_ID,
      client_secret: process.env.GHL_CLIENT_SECRET!,
      refresh_token: refreshToken,
    }),
  });
  if (!response.ok) throw new Error('Token refresh failed');
  return response.json();
}

export async function ghlFetch(endpoint: string, accessToken: string) {
  const response = await fetch(`${GHL_API_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(`API call failed: ${response.status}`);
  return response.json();
}

// Client-side utilities (for use in components)
export const isAuthenticated = () => {
  if (typeof window === 'undefined') return false;
  return !!sessionStorage.getItem('ghl_access_token');
};

export const getAccessToken = () => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('ghl_access_token');
};

export const logout = () => {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem('ghl_access_token');
  sessionStorage.removeItem('ghl_refresh_token');
  sessionStorage.removeItem('ghl_code_verifier');
};

export async function fetchUsers(accessToken: string, locationId: string) {
  const response = await fetch(`https://services.leadconnectorhq.com/users/?locationId=${locationId}`, {
    headers: {
      'Accept': 'application/json',
      'Version': '2021-07-28',
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) throw new Error(`Failed to fetch users: ${response.status}`);
  return response.json();
}