import { whopFetchAll, COMPANY_ID } from './client';

export async function getProducts() {
  const commonParams = { company_id: COMPANY_ID };
  return await whopFetchAll('/products', commonParams);
}
