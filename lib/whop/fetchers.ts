import { WhopPayment, WhopMember, WhopMembership } from '@/types';

const DEFAULT_WHOP_API_KEY = process.env.WHOP_API_KEY;
const DEFAULT_COMPANY_ID = process.env.COMPANY_ID || 'biz_gwvX72rmmUEqwj';
const BASE_URL = 'https://api.whop.com/v2';

const COMPANY_API_KEYS: Record<string, string | undefined> = {
  'biz_gwvX72rmmUEqwj': process.env.WHOP_API_KEY,
  'biz_qcxyUyVWg1WZ7P': 'apik_tPkzrs0suoSpQ_C3145112_C_d659a7bf788d9a54d1785921858bdb10ca5c784a6796e4ec4c10c6fd82d68c'
};

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function whopFetch(endpoint: string, params: Record<string, string> = {}, retries = 3, companyId?: string) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

  const apiKey = (companyId && COMPANY_API_KEYS[companyId]) || DEFAULT_WHOP_API_KEY;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
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
async function whopFetchAll(endpoint: string, params: Record<string, string> = {}, companyId?: string) {
  let allData: any[] = [];
  let cursor: string | null = null;
  let page = 1;

  do {
    const currentParams = { ...params };
    if (cursor) currentParams.pagination_cursor = cursor;

    console.log(`Fetching ${endpoint} page ${page}...`);
    const response = await whopFetch(endpoint, currentParams, 3, companyId);

    // Whop API usually returns { data: [], pagination: { next_cursor: "" } }
    const data = response.data || [];
    allData = [...allData, ...data];

    cursor = response.pagination?.next_cursor || null;
    console.log(`Fetched ${data.length} items from ${endpoint} page ${page}. Total: ${allData.length}`);
    page++;
    
    // Safety break to prevent infinite loops if API behavior changes
    if (page > 50) break; 
  } while (cursor);

  return allData;
}

export async function getProducts(companyId: string = DEFAULT_COMPANY_ID) {
  const commonParams = { company_id: companyId, expand: 'metrics' };
  const products = await whopFetchAll('/products', commonParams, companyId);

  // Fetch detailed data for each product to get accurate member counts
  // Limit concurrency to avoid hitting rate limits or timeouts
  const detailedProducts = [];
  for (const product of products) {
    try {
      console.log(`Fetching details for product: ${product.id}`);
      const details = await whopFetch(`/products/${product.id}`, {}, 3, companyId);
      detailedProducts.push({ ...product, ...details });
    } catch (error) {
      console.error(`Failed to fetch details for product ${product.id}:`, error);
      detailedProducts.push(product);
    }
  }

  return detailedProducts;
}

export async function getProductDetails(productId: string, companyId?: string) {
  return await whopFetch(`/products/${productId}`, {}, 3, companyId);
}

export async function getPayments(companyId: string = DEFAULT_COMPANY_ID): Promise<WhopPayment[]> {
  let allPayments: WhopPayment[] = [];
  let cursor: string | null = null;

  do {
    const params: Record<string, string> = { company_id: companyId };
    if (cursor) params.after = cursor;

    const response = await whopFetch('/payments', params, 3, companyId);

    const data = response.data || [];
    allPayments = [...allPayments, ...data];

    cursor = response.page_info?.has_next_page ? response.page_info.end_cursor : null;
  } while (cursor);

  return allPayments;
}

export async function getMembers(companyId: string = DEFAULT_COMPANY_ID): Promise<WhopMember[]> {
  console.log('Fetching members...');
  const members = await whopFetchAll('/members', { company_id: companyId }, companyId);
  console.log(`Fetched ${members.length} members`);
  return members as WhopMember[];
}

export async function getMemberships(companyId: string = DEFAULT_COMPANY_ID): Promise<WhopMembership[]> {
  console.log('Fetching memberships...');
  let allMemberships: WhopMembership[] = [];
  let cursor: string | null = null;

  do {
    const params: Record<string, string> = { company_id: companyId };
    if (cursor) params.after = cursor;

    const response = await whopFetch('/memberships', params, 3, companyId);

    const data = response.data || [];
    allMemberships = [...allMemberships, ...data];

    cursor = response.page_info?.has_next_page ? response.page_info.end_cursor : null;
    console.log(`Fetched ${allMemberships.length} memberships so far...`);
  } while (cursor);

  return allMemberships;
}

export async function getUser(userId: string, companyId?: string) {
  return await whopFetch(`/users/${userId}`, {}, 3, companyId);
}
