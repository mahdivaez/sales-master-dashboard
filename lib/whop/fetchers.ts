import { WhopPayment, WhopMember, WhopMembership } from '@/types';
import { COMPANIES } from '@/lib/config';

const DEFAULT_WHOP_API_KEY = process.env.WHOP_API_KEY;
const DEFAULT_COMPANY_ID = process.env.COMPANY_ID || 'biz_gwvX72rmmUEqwj';
const BASE_URL = 'https://api.whop.com/v1';

const COMPANY_API_KEYS: Record<string, string | undefined> = {};
COMPANIES.forEach(c => {
  COMPANY_API_KEYS[c.whopCompanyId] = c.whopApiKey;
});

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function whopFetch(endpoint: string, params: Record<string, string> = {}, retries = 3, companyId?: string) {
  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));

  const apiKey = (companyId && COMPANY_API_KEYS[companyId]) || DEFAULT_WHOP_API_KEY;
  
  console.log(`Using API Key for company ${companyId}: ${apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING'}`);

  if (!apiKey) {
    console.error(`No API key found for company ID: ${companyId}`);
    throw new Error(`Missing API key for company ID: ${companyId}`);
  }

  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      // Reduced timeout to 15 seconds for better performance
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      console.log(`Fetching ${url.toString()} (attempt ${i + 1}/${retries})`);
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        signal: controller.signal,
        next: { revalidate: 0 } 
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log(`Whop API Success - URL: ${url.toString()}, Items: ${Array.isArray(data) ? data.length : (data.data ? data.data.length : 'object')}`);
        if (endpoint === '/payments' && data.data && data.data.length > 0) {
          console.log('Sample payment user:', JSON.stringify(data.data[0].user));
        }
        return data;
      }

      // Handle different error status codes differently
      if (!response.ok) {
        const errorText = await response.text();
        let errorJson;
        
        try {
          // Try to parse error as JSON if possible
          errorJson = JSON.parse(errorText);
        } catch (e) {
          // If not JSON, use the text as is
          errorJson = { message: errorText };
        }
        
        console.error(`Whop API Error - URL: ${url.toString()}, Status: ${response.status}, Body:`, errorJson);
        
        // Handle rate limiting specifically
        if (response.status === 429) {
          const retryAfter = response.headers.get('retry-after') || '5';
          const waitTime = parseInt(retryAfter, 10) * 1000 || 5000;
          console.warn(`Rate limited by Whop API, waiting ${waitTime}ms before retry`);
          await delay(waitTime);
          continue; // Retry after waiting
        }
        
        // Handle authentication errors
        if (response.status === 401 || response.status === 403) {
          console.error(`Authentication error with Whop API for company ID: ${companyId}`);
          throw new Error(`Authentication error (${response.status}): ${errorJson.message || errorText}`);
        }
        
        // For other errors, throw with details
        throw new Error(`Whop API Error (${response.status}): ${errorJson.message || errorText}`);
      }

      // Parse JSON response with error handling
      try {
        const data = await response.json();
        return data;
      } catch (jsonError) {
        console.error(`Failed to parse JSON response from ${url.toString()}:`, jsonError);
        throw new Error(`Invalid JSON response from Whop API: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
      }
    } catch (error: any) {
      // Enhanced error detection
      const isTimeout = error.name === 'AbortError' || 
                        error.name === 'TimeoutError' || 
                        error.code === 'UND_ERR_CONNECT_TIMEOUT' || 
                        error.code === 'ETIMEDOUT' ||
                        error.message?.includes('timeout');
      
      const isNetworkError = error.name === 'TypeError' || 
                             error.message?.includes('network') ||
                             error.message?.includes('fetch');

      // Last retry attempt
      if (i === retries - 1) {
        console.error(`Whop API fetch failed after ${retries} attempts for ${endpoint}:`, error.message);
        throw error;
      }

      // Handle different error types
      if (isTimeout) {
        const waitTime = Math.pow(2, i) * 1500; // Increased backoff time
        console.warn(`Whop API timeout, retrying in ${waitTime}ms... (Attempt ${i + 1}/${retries})`);
        await delay(waitTime);
        continue;
      } else if (isNetworkError) {
        const waitTime = Math.pow(2, i) * 1000;
        console.warn(`Whop API network error, retrying in ${waitTime}ms... (Attempt ${i + 1}/${retries})`);
        await delay(waitTime);
        continue;
      }

      // For other errors, throw immediately
      throw error;
    }
  }
  
  // This should never be reached due to the throw in the last iteration of the loop
  throw new Error(`Failed to fetch from Whop API after ${retries} attempts`);
}

/**
 * Helper for cursor-based pagination with improved duplicate detection
 */
async function whopFetchAll(endpoint: string, params: Record<string, string> = {}, companyId?: string, maxPages: number = 50, globalSeenIds?: Set<string>) {
  let allData: any[] = [];
  const seenIds = globalSeenIds || new Set<string>(); // برای جلوگیری از duplicate
  let cursor: string | null = null;
  let page = 1;
  let consecutiveEmptyPages = 0;
  let totalFetched = 0;

  try {
    do {
      const currentParams = { ...params };
      if (cursor) {
        if (endpoint === '/members') {
          currentParams.pagination_cursor = cursor;
        } else if (endpoint === '/payments' || endpoint === '/memberships') {
          currentParams.after = cursor;
        } else {
          currentParams.pagination_cursor = cursor;
        }
      }

      console.log(`Fetching ${endpoint} page ${page} with params:`, JSON.stringify(currentParams));
      const response = await whopFetch(endpoint, currentParams, 3, companyId);

      // Handle different response formats
      const data = Array.isArray(response) ? response : (response.data || []);
      totalFetched += data.length;
      
      // Enhanced duplicate detection
      const newData = data.filter((item: any) => {
        if (!item || typeof item !== 'object') {
          console.warn(`Invalid item in response: ${JSON.stringify(item)}`);
          return false;
        }
        
        if (!item.id) {
          console.warn(`Item without ID detected: ${JSON.stringify(item)}`);
          return true; // Include items without ID but log a warning
        }
        
        if (seenIds.has(item.id)) {
          console.log(`Duplicate detected: ${item.id}`);
          return false;
        }
        
        seenIds.add(item.id);
        return true;
      });

      allData = [...allData, ...newData];

      // Improved pagination handling
      if (Array.isArray(response)) {
        cursor = null;
      } else {
        // Handle different pagination formats
        if (response.pagination) {
          cursor = response.pagination.next_cursor;
        } else if (response.page_info) {
          cursor = response.page_info.has_next_page ? response.page_info.end_cursor : null;
        } else if (response.meta && response.meta.pagination) {
          // Some APIs use meta.pagination
          cursor = response.meta.pagination.next_cursor;
        } else {
          cursor = null;
        }
      }

      // Handle empty pages
      if (data.length === 0) {
        consecutiveEmptyPages++;
        if (consecutiveEmptyPages >= 2 || !cursor) {
          console.log(`Breaking after ${consecutiveEmptyPages} empty pages`);
          break;
        }
      } else {
        consecutiveEmptyPages = 0;
      }

      // Check if we've reached the end based on limit
      const limit = parseInt(currentParams.limit || '50');
      if (data.length < limit && !cursor) {
        console.log(`Received fewer items (${data.length}) than limit (${limit}), ending pagination`);
        break;
      }

      console.log(`Fetched ${newData.length} new items (${data.length - newData.length} duplicates) from ${endpoint} page ${page}. Total unique: ${allData.length}`);
      page++;
      
      // Increased safety limit
      if (page > maxPages) {
        console.warn(`Reached page limit (${maxPages}) for ${endpoint}`);
        break;
      }

      // Delay to prevent rate limiting
      if (cursor) await delay(200); // Increased delay to be safer
      
    } while (cursor);

    console.log(`Completed fetching ${endpoint}: ${allData.length} unique items from ${totalFetched} total items across ${page-1} pages`);
    return allData;
  } catch (error: any) {
    console.error(`Error in whopFetchAll for ${endpoint}:`, error);
    
    // Enhanced error logging
    if (error.code) {
      console.error(`Error code: ${error.code}`);
    }
    
    if (error.response) {
      console.error(`Response status: ${error.response.status}`);
      console.error(`Response data:`, error.response.data);
    }
    
    // Log pagination state at time of error
    console.error(`Pagination state at error: page=${page}, cursor=${cursor}, consecutive empty pages=${consecutiveEmptyPages}`);
    
    // Return what we have so far rather than nothing
    console.log(`Returning ${allData.length} items collected before error`);
    return allData;
  }
}

export async function getProducts(companyId: string = DEFAULT_COMPANY_ID) {
  const commonParams = { company_id: companyId, expand: 'metrics' };
  const products = await whopFetchAll('/products', commonParams, companyId);

  const detailedProducts = [];
  for (const product of products) {
    try {
      console.log(`Fetching details for product: ${product.id}`);
      const details = await whopFetch(`/products/${product.id}`, {}, 3, companyId);
      detailedProducts.push({ ...product, ...details });
      await delay(100); // Rate limit prevention
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

export async function getPayments(companyId: string = DEFAULT_COMPANY_ID, startDate?: string, globalSeenIds?: Set<string>): Promise<WhopPayment[]> {
  console.log('Fetching payments...');
  const params: Record<string, string> = {
    company_id: companyId,
    limit: '100' // افزایش limit برای کاهش تعداد request ها
  };
  
  let startTimestamp = 0;
  let maxPages = 50;

  if (startDate) {
    try {
      // Validate the date format
      const parsedDate = new Date(startDate);
      if (isNaN(parsedDate.getTime())) {
        console.error(`Invalid start date format: ${startDate}`);
        // Default to 6 months ago if date is invalid
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        startTimestamp = sixMonthsAgo.getTime();
        console.log(`Using default date (6 months ago): ${sixMonthsAgo.toISOString()}`);
      } else {
        startTimestamp = parsedDate.getTime();
        // Whop API uses Unix timestamp in seconds
        const unixTimestamp = Math.floor(startTimestamp / 1000);
        params.created_at = `gte:${unixTimestamp}`;
        console.log(`Filtering payments from timestamp: ${unixTimestamp} (${startDate})`);
        // If we have a start date, we probably don't need to fetch 200 pages
        maxPages = 50;
      }
    } catch (error) {
      console.error(`Error parsing start date: ${startDate}`, error);
      // Default to 6 months ago if there's an error
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      startTimestamp = sixMonthsAgo.getTime();
      console.log(`Using default date (6 months ago): ${sixMonthsAgo.toISOString()}`);
    }
  }
  
  // Fetch all payments
  const payments = await whopFetchAll('/payments', params, companyId, maxPages, globalSeenIds);
  console.log(`Fetched ${payments.length} payments`);
  
  // Always apply client-side filtering to ensure consistency
  if (startTimestamp > 0 && payments.length > 0) {
    const filtered = (payments as WhopPayment[]).filter(p => {
      // Skip items without created_at
      if (!p.created_at) {
        console.warn(`Payment without created_at: ${p.id}`);
        return false;
      }
      
      try {
        const createdAt = new Date(p.created_at).getTime();
        return createdAt >= startTimestamp;
      } catch (error) {
        console.error(`Error parsing payment date: ${p.created_at}`, error);
        return false;
      }
    });
    
    console.log(`After date filtering: ${filtered.length} payments (removed ${payments.length - filtered.length})`);
    return filtered;
  }
  
  return payments as WhopPayment[];
}

export async function getMembers(companyId: string = DEFAULT_COMPANY_ID, startDate?: string, globalSeenIds?: Set<string>): Promise<WhopMember[]> {
  console.log('Fetching members...');
  const params: Record<string, string> = {
    company_id: companyId,
    limit: '100'
  };
  
  let startTimestamp = 0;
  let maxPages = 50;

  if (startDate) {
    try {
      // Validate the date format
      const parsedDate = new Date(startDate);
      if (isNaN(parsedDate.getTime())) {
        console.error(`Invalid start date format: ${startDate}`);
        // Default to 6 months ago if date is invalid
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        startTimestamp = sixMonthsAgo.getTime();
        console.log(`Using default date (6 months ago): ${sixMonthsAgo.toISOString()}`);
      } else {
        startTimestamp = parsedDate.getTime();
        // Note: The members endpoint might not support date filtering via API
        // We'll apply client-side filtering after fetching
        console.log(`Will filter members from date: ${startDate} (${startTimestamp})`);
        maxPages = 50;
      }
    } catch (error) {
      console.error(`Error parsing start date: ${startDate}`, error);
      // Default to 6 months ago if there's an error
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      startTimestamp = sixMonthsAgo.getTime();
      console.log(`Using default date (6 months ago): ${sixMonthsAgo.toISOString()}`);
    }
  }
  
  // Fetch all members
  const members = await whopFetchAll('/members', params, companyId, maxPages, globalSeenIds);
  console.log(`Fetched ${members.length} members`);
  
  // Apply client-side filtering if we have a start date
  if (startTimestamp > 0 && members.length > 0) {
    const filtered = (members as WhopMember[]).filter(m => {
      // If no joined_at date, keep the member to be safe
      if (!m.joined_at) {
        console.warn(`Member without joined_at date: ${m.id}`);
        return true; // Keep members without joined_at to be safe
      }
      
      try {
        const joinedAt = new Date(m.joined_at).getTime();
        return joinedAt >= startTimestamp;
      } catch (error) {
        console.error(`Error parsing member joined_at date: ${m.joined_at}`, error);
        return true; // Keep members with invalid dates to be safe
      }
    });
    
    console.log(`After date filtering: ${filtered.length} members (removed ${members.length - filtered.length})`);
    return filtered;
  }
  
  return members as WhopMember[];
}

export async function getMemberships(companyId: string = DEFAULT_COMPANY_ID, startDate?: string, globalSeenIds?: Set<string>): Promise<WhopMembership[]> {
  console.log('Fetching memberships...');
  const params: Record<string, string> = {
    company_id: companyId,
    limit: '100'
  };
  
  let startTimestamp = 0;
  let maxPages = 50;

  if (startDate) {
    try {
      // Validate the date format
      const parsedDate = new Date(startDate);
      if (isNaN(parsedDate.getTime())) {
        console.error(`Invalid start date format: ${startDate}`);
        // Default to 6 months ago if date is invalid
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        startTimestamp = sixMonthsAgo.getTime();
        console.log(`Using default date (6 months ago): ${sixMonthsAgo.toISOString()}`);
      } else {
        startTimestamp = parsedDate.getTime();
        // Whop API uses Unix timestamp in seconds
        const unixTimestamp = Math.floor(startTimestamp / 1000);
        params.created_at = `gte:${unixTimestamp}`;
        console.log(`Filtering memberships from timestamp: ${unixTimestamp} (${startDate})`);
        maxPages = 50;
      }
    } catch (error) {
      console.error(`Error parsing start date: ${startDate}`, error);
      // Default to 6 months ago if there's an error
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      startTimestamp = sixMonthsAgo.getTime();
      console.log(`Using default date (6 months ago): ${sixMonthsAgo.toISOString()}`);
    }
  }
  
  // Fetch all memberships
  const memberships = await whopFetchAll('/memberships', params, companyId, maxPages, globalSeenIds);
  console.log(`Fetched ${memberships.length} memberships`);
  
  // Always apply client-side filtering to ensure consistency
  if (startTimestamp > 0 && memberships.length > 0) {
    const filtered = (memberships as WhopMembership[]).filter(m => {
      // Skip items without created_at
      if (!m.created_at) {
        console.warn(`Membership without created_at: ${m.id}`);
        return true; // Keep memberships without created_at to be safe
      }
      
      try {
        const createdAt = new Date(m.created_at).getTime();
        return createdAt >= startTimestamp;
      } catch (error) {
        console.error(`Error parsing membership date: ${m.created_at}`, error);
        return true; // Keep memberships with invalid dates to be safe
      }
    });
    
    console.log(`After date filtering: ${filtered.length} memberships (removed ${memberships.length - filtered.length})`);
    return filtered;
  }
  
  return memberships as WhopMembership[];
}

export async function getUser(userId: string, companyId?: string) {
  try {
    console.log(`Fetching user details for user ID: ${userId}`);
    return await whopFetch(`/users/${userId}`, {}, 3, companyId);
  } catch (error) {
    console.error(`Failed to fetch user details for user ID: ${userId}`, error);
    return null;
  }
}

/**
 * Fetch all unique users from payments and memberships who might not be in the members list
 * This ensures we don't miss any user data
 */
export async function getAllUniqueUsers(
  payments: WhopPayment[],
  memberships: WhopMembership[],
  members: WhopMember[],
  companyId: string = DEFAULT_COMPANY_ID,
  explicitUserIds?: string[]
) {
  console.log('Fetching all unique users...');
  
  // Collect all unique user IDs
  const uniqueUserIds = new Set<string>(explicitUserIds || []);
  
  if (!explicitUserIds) {
    // Create a set of all user IDs from members
    const memberUserIds = new Set(members.map(member => member.user?.id).filter(Boolean));
    
    // Add user IDs from payments
    payments.forEach(payment => {
      if (payment.user?.id && !memberUserIds.has(payment.user.id)) {
        uniqueUserIds.add(payment.user.id);
      }
    });
    
    // Add user IDs from memberships
    memberships.forEach(membership => {
      if (membership.user?.id && !memberUserIds.has(membership.user.id)) {
        uniqueUserIds.add(membership.user.id);
      }
    });
  }
  
  console.log(`Found ${uniqueUserIds.size} unique users that need additional data fetching`);
  
  // Fetch user details for each unique user ID
  const userDetails: Record<string, any> = {};
  let successCount = 0;
  let failureCount = 0;
  
  // Parallelize user fetching with concurrency limit
  const userIds = Array.from(uniqueUserIds);
  const CONCURRENCY_LIMIT = 10;
  
  for (let i = 0; i < userIds.length; i += CONCURRENCY_LIMIT) {
    const batch = userIds.slice(i, i + CONCURRENCY_LIMIT);
    await Promise.all(batch.map(async (userId) => {
      try {
        const userDetail = await getUser(userId, companyId);
        if (userDetail) {
          userDetails[userId] = userDetail;
          successCount++;
        } else {
          failureCount++;
        }
      } catch (error) {
        console.error(`Failed to fetch details for user ${userId}:`, error);
        failureCount++;
      }
    }));
    
    // Small delay between batches to respect rate limits
    if (i + CONCURRENCY_LIMIT < userIds.length) {
      await delay(200);
    }
  }
  
  console.log(`Successfully fetched ${successCount} user details, failed for ${failureCount} users`);
  return userDetails;
}