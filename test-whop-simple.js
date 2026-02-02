
const { getMembers, getPayments, getMemberships } = require('./lib/whop/fetchers');
require('dotenv').config();

const COMPANY_ID = 'biz_qcxyUyVWg1WZ7P';

async function test() {
  console.log('Testing Whop API with Key:', process.env.WHOP_API_KEY ? 'Found' : 'Not Found');
  try {
    console.log('Fetching members...');
    const members = await getMembers(COMPANY_ID);
    console.log('Members count:', members.length);
    if (members.length > 0) {
      console.log('First member email:', members[0].user?.email || members[0].email);
    }

    console.log('Fetching payments...');
    const payments = await getPayments(COMPANY_ID);
    console.log('Payments count:', payments.length);

    console.log('Fetching memberships...');
    const memberships = await getMemberships(COMPANY_ID);
    console.log('Memberships count:', memberships.length);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
