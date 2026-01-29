// Debug script to test the Whop API integration
// Run with: node debug-whop.js

// Import required modules
const { getMembers, getPayments, getMemberships, getAllUniqueUsers, getUser } = require('./lib/whop/fetchers');

// Company ID to test
const COMPANY_ID = 'biz_qcxyUyVWg1WZ7P';

async function testWhopIntegration() {
  console.log('Starting Whop API integration test...');
  
  try {
    // 1. Fetch basic data
    console.log('Fetching members, payments, and memberships...');
    const [members, payments, memberships] = await Promise.all([
      getMembers(COMPANY_ID),
      getPayments(COMPANY_ID),
      getMemberships(COMPANY_ID)
    ]);
    
    console.log(`Fetched ${members.length} members, ${payments.length} payments, ${memberships.length} memberships`);
    
    // 2. Fetch additional user data
    console.log('Fetching additional user data...');
    const additionalUserData = await getAllUniqueUsers(payments, memberships, members, COMPANY_ID);
    console.log(`Fetched additional data for ${Object.keys(additionalUserData).length} users`);
    
    // 3. Analyze data for completeness
    const memberUserIds = new Set(members.map(member => member.user?.id).filter(Boolean));
    const paymentUserIds = new Set(payments.map(payment => payment.user?.id).filter(Boolean));
    const membershipUserIds = new Set(memberships.map(membership => membership.user?.id).filter(Boolean));
    
    // Combine all user IDs
    const allUserIds = new Set([...memberUserIds, ...paymentUserIds, ...membershipUserIds]);
    console.log(`Total unique user IDs across all data: ${allUserIds.size}`);
    
    // Check for users in payments/memberships but not in members
    const usersOnlyInPayments = [...paymentUserIds].filter(id => !memberUserIds.has(id));
    const usersOnlyInMemberships = [...membershipUserIds].filter(id => !memberUserIds.has(id));
    
    console.log(`Users only in payments: ${usersOnlyInPayments.length}`);
    console.log(`Users only in memberships: ${usersOnlyInMemberships.length}`);
    
    // Check if we have additional data for these users
    const additionalDataCoverage = [...usersOnlyInPayments, ...usersOnlyInMemberships].filter(
      id => additionalUserData[id]
    ).length;
    
    console.log(`Additional data coverage: ${additionalDataCoverage} out of ${usersOnlyInPayments.length + usersOnlyInMemberships.length}`);
    
    // 4. Sample some data
    if (members.length > 0) {
      console.log('\nSample member:');
      console.log(JSON.stringify(members[0], null, 2));
    }
    
    if (Object.keys(additionalUserData).length > 0) {
      const sampleUserId = Object.keys(additionalUserData)[0];
      console.log('\nSample additional user data:');
      console.log(JSON.stringify(additionalUserData[sampleUserId], null, 2));
    }
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testWhopIntegration();