import { getMembers, getPayments, getMemberships } from './lib/whop/fetchers';
import * as dotenv from 'dotenv';
dotenv.config();

async function debug() {
  const COMPANY_1_ID = 'biz_gwvX72rmmUEqwj';
  const COMPANY_2_ID = 'biz_qcxyUyVWg1WZ7P';
  const targetEmail = 'sootyrick@yahoo.com';

  console.log('Checking Company 1...');
  const members1 = await getMembers(COMPANY_1_ID);
  const found1 = members1.find(m => m.user.email.toLowerCase() === targetEmail.toLowerCase());
  console.log('Found in Company 1 members:', found1 ? 'Yes' : 'No');

  console.log('Checking Company 2...');
  const members2 = await getMembers(COMPANY_2_ID);
  const found2 = members2.find(m => m.user.email.toLowerCase() === targetEmail.toLowerCase());
  console.log('Found in Company 2 members:', found2 ? 'Yes' : 'No');

  if (!found1 && !found2) {
    console.log('Checking payments for Company 1...');
    const payments1 = await getPayments(COMPANY_1_ID);
    const pFound1 = payments1.find(p => p.user.email.toLowerCase() === targetEmail.toLowerCase());
    console.log('Found in Company 1 payments:', pFound1 ? 'Yes' : 'No');

    console.log('Checking payments for Company 2...');
    const payments2 = await getPayments(COMPANY_2_ID);
    const pFound2 = payments2.find(p => p.user.email.toLowerCase() === targetEmail.toLowerCase());
    console.log('Found in Company 2 payments:', pFound2 ? 'Yes' : 'No');
  }
}

debug().catch(console.error);
