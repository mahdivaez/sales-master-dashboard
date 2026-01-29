import { randomBytes, createHash } from 'crypto';

const GHL_CLIENT_ID = process.env.NEXT_PUBLIC_GHL_CLIENT_ID || "pit-2649ae7e-b7c9-4422-bcb8-1566ed0c2137";
const GHL_AUTH_URL = "https://marketplace.gohighlevel.com/oauth/chooselocation";
const GHL_TOKEN_URL = "https://services.leadconnectorhq.com/oauth/token";
const GHL_API_BASE = "https://services.leadconnectorhq.com"; // V2 Base

export function generatePKCE() {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

export function getAuthUrl(challenge: string) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: GHL_CLIENT_ID,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ghl/callback`,
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
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ghl/callback`,
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || 'Token exchange failed');
  }
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

// Client-side utilities
export const isAuthenticated = () => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('ghl_access_token');
};

export const getAccessToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ghl_access_token');
};

export const logout = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('ghl_access_token');
  localStorage.removeItem('ghl_refresh_token');
  localStorage.removeItem('ghl_location_id');
};

export async function fetchGhlData(endpoint: string, accessToken: string) {
  const response = await fetch(`${GHL_API_BASE}${endpoint}`, {
    headers: {
      'Accept': 'application/json',
      'Version': '2021-07-28',
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) throw new Error(`GHL API error: ${response.status}`);
  return response.json();
}

export async function searchContactByEmail(email: string, locationId: string, accessToken: string) {
  const response = await fetch(`${GHL_API_BASE}/contacts/search`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Version': '2021-07-28',
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      locationId,
      pageLimit: 1,
      filters: [
        {
          field: 'email',
          operator: 'eq',
          value: email
        }
      ]
    })
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.contacts?.[0] || null;
}
