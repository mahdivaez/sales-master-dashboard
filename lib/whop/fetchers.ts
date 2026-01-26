import { whopFetch, whopFetchAll, COMPANY_ID } from './client';

export async function fetchAllWhopData() {
  console.log('Starting data fetch (Direct API)...');
  
  const commonParams = { company_id: COMPANY_ID };

  // 1. Fetch Products
  const products = await whopFetchAll('/products', commonParams);
  console.log(`✓ Fetched ${products.length} products`);

  // 2. Fetch Plans
  const plans = await whopFetchAll('/plans', commonParams);
  console.log(`✓ Fetched ${plans.length} plans`);

  // 3. Fetch Memberships
  const memberships = await whopFetchAll('/memberships', commonParams);
  console.log(`✓ Fetched ${memberships.length} memberships`);

  // 4. Extract unique user IDs
  const uniqueUserIds = [...new Set(memberships.map((m: any) => m.user_id).filter(Boolean))];
  
  // 5. Fetch Users (individually with batching)
  const users = [];
  const BATCH_SIZE = 10;
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  for (let i = 0; i < uniqueUserIds.length; i += BATCH_SIZE) {
    const batch = uniqueUserIds.slice(i, i + BATCH_SIZE);
    try {
      const batchUsers = await Promise.all(
        batch.map(id => whopFetch(`/users/${id}`).catch((err: any) => {
          console.error(`Error fetching user ${id}:`, err);
          return null;
        }))
      );
      users.push(...batchUsers.filter(Boolean));
      await delay(500);
    } catch (error) {
      console.error('Batch error:', error);
    }
  }
  console.log(`✓ Fetched ${users.length} users`);

  // 6. Fetch Payments
  const payments = await whopFetchAll('/payments', commonParams);

  // 7. Fetch Refunds
  const refunds = await whopFetchAll('/refunds', commonParams);

  // 8. Fetch Reviews
  const reviews = await whopFetchAll('/reviews', commonParams);

  // 9. Fetch Promo Codes
  const promoCodes = await whopFetchAll('/promo_codes', commonParams);

  // 10. Fetch Invoices
  const invoices = await whopFetchAll('/invoices', commonParams);

  // 11. Fetch Leads
  const leads = await whopFetchAll('/leads', commonParams);

  // 12. Fetch Entries
  const entries = await whopFetchAll('/entries', commonParams);

  return {
    products,
    plans,
    memberships,
    users,
    payments,
    refunds,
    reviews,
    promoCodes,
    invoices,
    leads,
    entries,
    fetchedAt: new Date().toISOString()
  };
}
