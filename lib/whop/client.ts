export const WHOP_API_KEY = process.env.WHOP_API_KEY;
export const COMPANY_ID = process.env.COMPANY_ID || 'biz_gwvX72rmmUEqwj';
export const BASE_URL = 'https://api.whop.com/v1';

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function whopFetch(endpoint: string, params: Record<string, string> = {}, retries = 3) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${WHOP_API_KEY}`,
          'Content-Type': 'application/json',
        },
        // Add a signal to ensure we don't hang forever if the default is too long
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`Whop API Error Details - URL: ${url.toString()}, Status: ${response.status}, Body: ${error}`);
        throw new Error(`Whop API Error (${response.status}): ${error}`);
      }

      return await response.json();
    } catch (error: any) {
      const isTimeout = error.name === 'TimeoutError' || error.code === 'UND_ERR_CONNECT_TIMEOUT';
      
      if (i === retries - 1) {
        console.error(`Whop API fetch failed after ${retries} attempts:`, error.message);
        throw error;
      }

      if (isTimeout) {
        const waitTime = Math.pow(2, i) * 1000;
        console.warn(`Whop API timeout, retrying in ${waitTime}ms... (Attempt ${i + 1}/${retries})`);
        await delay(waitTime);
        continue;
      }

      throw error;
    }
  }
}

/**
 * Helper for cursor-based pagination
 */
export async function whopFetchAll(endpoint: string, params: Record<string, string> = {}) {
  let allData: any[] = [];
  let cursor: string | null = null;

  do {
    const currentParams = { ...params };
    if (cursor) currentParams.pagination_cursor = cursor;

    const response = await whopFetch(endpoint, currentParams);
    
    // Whop API usually returns { data: [], pagination: { next_cursor: "" } }
    const data = response.data || [];
    allData = [...allData, ...data];
    
    cursor = response.pagination?.next_cursor || null;
  } while (cursor);

  return allData;
}
