'use server';

// Import necessary modules
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { getMembers, getPayments, getMemberships, getAllUniqueUsers, getUser } from '@/lib/whop/fetchers';
import { WhopMember, WhopPayment, WhopMembership } from '@/types';

// Helper function to convert string to camelCase
function toCamelCase(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase());
}

export async function getUnifiedUserData(options: {
  limit?: number;
  offset?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  ghlToken?: string;
  ghlLocationId?: string;
} = {}) {
  const { limit = 50, offset = 0, search = '', startDate, endDate } = options;
  
  // Use provided tokens or fallback to environment variables
  const ghlToken = options.ghlToken || process.env.GHL_ACCESS_TOKEN;
  const ghlLocationId = options.ghlLocationId || process.env.GHL_LOCATION_ID || process.env.LOCATION_ID;

  console.log('GHL Config Check:', { 
    hasToken: !!ghlToken, 
    tokenPrefix: ghlToken ? ghlToken.substring(0, 10) : 'none',
    locationId: ghlLocationId 
  });

  // Initialize variables at the top level so they're accessible in the catch block
  let members2: WhopMember[] = [];
  let payments2: WhopPayment[] = [];
  let memberships2: WhopMembership[] = [];
  let additionalUserData: Record<string, any> = {};
  try {
    const COMPANY_2_ID = 'biz_qcxyUyVWg1WZ7P';
    console.log('Starting unified data fetch process with options:', options);

    // 1. Fetch Whop Data for Company 2 only
    console.log('Fetching Whop data for company ID:', COMPANY_2_ID);
    
    // Optimization: If search is active, we might want to fetch more or different data,
    // but Whop API doesn't support email search on these endpoints easily.
    // We keep the current fetch but we will filter the results.
    
    const whopPromises = [
      getMembers(COMPANY_2_ID, startDate),
      getPayments(COMPANY_2_ID, startDate),
      getMemberships(COMPANY_2_ID, startDate)
    ];

    const results = await Promise.all(whopPromises);
    members2 = results[0] as WhopMember[];
    payments2 = results[1] as WhopPayment[];
    memberships2 = results[2] as WhopMembership[];

    // Optimization: Filter Whop data by search term if provided
    if (search) {
      const searchLower = search.toLowerCase();
      members2 = members2.filter(m => 
        (m.user?.email?.toLowerCase().includes(searchLower)) ||
        (m.user?.name?.toLowerCase().includes(searchLower)) ||
        (m.user?.username?.toLowerCase().includes(searchLower))
      );
      payments2 = payments2.filter(p => 
        (p.user?.email?.toLowerCase().includes(searchLower)) ||
        (p.user?.name?.toLowerCase().includes(searchLower)) ||
        (p.user?.username?.toLowerCase().includes(searchLower))
      );
      memberships2 = memberships2.filter(m => 
        (m.user?.email?.toLowerCase().includes(searchLower)) ||
        (m.user?.name?.toLowerCase().includes(searchLower)) ||
        (m.user?.username?.toLowerCase().includes(searchLower))
      );
    }
    
    console.log(`Initial data fetch complete: ${members2.length} members, ${payments2.length} payments, ${memberships2.length} memberships`);

    // 1.1 Fetch additional user data for users who have payments/memberships but aren't in the members list
    // Optimization: Only fetch additional data for users we might actually display or if search is active
    console.log('Fetching additional user data for users not in members list...');
    
    // If we have a search term, we only care about users matching that search
    let filteredPaymentsForAdditionalData = payments2;
    let filteredMembershipsForAdditionalData = memberships2;
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPaymentsForAdditionalData = payments2.filter(p => 
        p.user?.email?.toLowerCase().includes(searchLower) || 
        p.user?.name?.toLowerCase().includes(searchLower) ||
        p.user?.username?.toLowerCase().includes(searchLower)
      );
      filteredMembershipsForAdditionalData = memberships2.filter(m => 
        m.user?.email?.toLowerCase().includes(searchLower) || 
        m.user?.name?.toLowerCase().includes(searchLower) ||
        m.user?.username?.toLowerCase().includes(searchLower)
      );
    } else {
      // If no search, maybe only fetch for the first few hundred to avoid massive API calls
      // since we only show 50 per page anyway.
      // But we need them for total counts... let's limit to a reasonable number.
      filteredPaymentsForAdditionalData = payments2.slice(0, 500);
      filteredMembershipsForAdditionalData = memberships2.slice(0, 500);
    }

    additionalUserData = await getAllUniqueUsers(
      filteredPaymentsForAdditionalData, 
      filteredMembershipsForAdditionalData, 
      members2, 
      COMPANY_2_ID
    );
    console.log(`Fetched additional data for ${Object.keys(additionalUserData).length} users`);

    // 2. Fetch Sheet Data
    console.log('Fetching sheet and pipeline data...');
    const [sheetResult, pipelineResult] = await Promise.all([
      getCashCollectedData(),
      getPipelineStageData()
    ]);
    const sheetData = sheetResult.success ? sheetResult.data : [];
    const pipelineData = pipelineResult.success ? pipelineResult.data : [];
    console.log(`Sheet data fetch complete: ${sheetData?.length || 0} sheet records, ${pipelineData?.length || 0} pipeline records`);

    // 3. Combine Data by Email
    console.log('Beginning data merging process...');
    const unifiedData: Record<string, any> = {};

    // Helper to process Whop data
    const processWhopData = (
      members: WhopMember[],
      payments: WhopPayment[],
      memberships: WhopMembership[],
      companyLabel: string,
      additionalUserData: Record<string, any> = {}
    ) => {
      members.forEach((member: WhopMember) => {
        if (!member.user || !member.user.email) return;
        const email = member.user.email.toLowerCase().trim();
        const userId = member.user.id;
        
        // Try to get enhanced user data if available
        const enhancedUserData = userId && additionalUserData[userId] ? additionalUserData[userId] : null;
        
        // Use enhanced data if available, otherwise use member data
        const name = enhancedUserData?.name ||
                    (member.user.name && member.user.name !== 'Unknown' ? member.user.name : '');
        const username = enhancedUserData?.username || member.user.username || '';

        if (!unifiedData[email]) {
          unifiedData[email] = {
            email,
            name: name || username || 'Unknown',
            username: username,
            whopId: userId,
            whopData: {
              member,
              payments: [],
              memberships: [],
              enhancedUserData: enhancedUserData
            },
            sheetData: [],
            totalSpentWhop: 0, // Will be calculated from payments
            totalSpentWhopBeforeFees: 0,
            totalSpentSheet: 0,
            lastPaymentDate: null,
            source: [companyLabel]
          };
        } else {
          if (!unifiedData[email].source.includes(companyLabel)) {
            unifiedData[email].source.push(companyLabel);
          }
          // totalSpentWhop is already handled by members and payments processing
          if (!unifiedData[email].whopData.member) {
            unifiedData[email].whopData.member = member;
            unifiedData[email].whopId = member.user.id;
            if (name) unifiedData[email].name = name;
            unifiedData[email].username = member.user.username;
          }
        }
      });

      payments.forEach((payment: WhopPayment) => {
        if (!payment.user || !payment.user.email) return;
        const email = payment.user.email.toLowerCase().trim();
        const userId = payment.user.id;
        
        // Try to get enhanced user data if available
        const enhancedUserData = userId && additionalUserData[userId] ? additionalUserData[userId] : null;
        
        // Use enhanced data if available, otherwise use payment data
        const name = enhancedUserData?.name ||
                    (payment.user.name && payment.user.name !== 'Unknown' ? payment.user.name : '');
        const username = enhancedUserData?.username || payment.user.username || '';
        
        const paymentDate = payment.created_at ? new Date(payment.created_at).getTime() : 0;

        if (!unifiedData[email]) {
          const amount = payment.amount_after_fees || payment.usd_total;
          const amountBefore = payment.usd_total;
          const refunded = payment.refunded_amount || 0;
          unifiedData[email] = {
            email,
            name: name || username || 'Unknown',
            username: username,
            whopId: userId || '',
            whopData: {
              member: null,
              payments: [payment],
              memberships: [],
              enhancedUserData: enhancedUserData
            },
            sheetData: [],
            totalSpentWhop: (payment.substatus === 'succeeded' || payment.substatus === 'resolution_won') ? Math.max(0, amount - refunded) : 0,
            totalSpentWhopBeforeFees: (payment.substatus === 'succeeded' || payment.substatus === 'resolution_won') ? Math.max(0, amountBefore - refunded) : 0,
            totalSpentSheet: 0,
            lastPaymentDate: paymentDate,
            source: [companyLabel]
          };
        } else {
          if (!unifiedData[email].source.includes(companyLabel)) {
            unifiedData[email].source.push(companyLabel);
          }
          unifiedData[email].whopData.payments.push(payment);
          if (payment.substatus === 'succeeded' || payment.substatus === 'resolution_won') {
            const amount = payment.amount_after_fees || payment.usd_total;
            const amountBefore = payment.usd_total;
            const refunded = payment.refunded_amount || 0;
            unifiedData[email].totalSpentWhop += Math.max(0, amount - refunded);
            unifiedData[email].totalSpentWhopBeforeFees += Math.max(0, amountBefore - refunded);
          }
          if (name && (!unifiedData[email].name || unifiedData[email].name === 'Unknown')) {
            unifiedData[email].name = name;
          }
          if (!unifiedData[email].lastPaymentDate || paymentDate > unifiedData[email].lastPaymentDate) {
            unifiedData[email].lastPaymentDate = paymentDate;
          }
        }
      });

      memberships.forEach((membership: WhopMembership) => {
        if (!membership.user || !membership.user.email) return;
        const email = membership.user.email.toLowerCase().trim();
        const userId = membership.user.id;
        
        // Try to get enhanced user data if available
        const enhancedUserData = userId && additionalUserData[userId] ? additionalUserData[userId] : null;
        
        // Use enhanced data if available, otherwise use membership data
        const name = enhancedUserData?.name ||
                    (membership.user.name && membership.user.name !== 'Unknown' ? membership.user.name : '');
        const username = enhancedUserData?.username || membership.user.username || '';
        
        if (!unifiedData[email]) {
          unifiedData[email] = {
            email,
            name: name || username || 'Unknown',
            username: username,
            whopId: userId || '',
            whopData: {
              member: null,
              payments: [],
              memberships: [membership],
              enhancedUserData: enhancedUserData
            },
            sheetData: [],
            totalSpentWhop: 0,
            totalSpentWhopBeforeFees: 0,
            totalSpentSheet: 0,
            lastPaymentDate: null,
            source: [companyLabel]
          };
        } else {
          if (!unifiedData[email].source.includes(companyLabel)) {
            unifiedData[email].source.push(companyLabel);
          }
          unifiedData[email].whopData.memberships.push(membership);
          if (name && (!unifiedData[email].name || unifiedData[email].name === 'Unknown')) {
            unifiedData[email].name = name;
          }
        }
      });
    };

    // Process only Company 2
    processWhopData(members2, payments2, memberships2, 'Whop', additionalUserData);

    // 4. Ensure all members are included even if they have no payments/memberships in the fetched lists
    members2.forEach((member: WhopMember) => {
      if (!member.user || !member.user.email) return;
      const email = member.user.email.toLowerCase().trim();
      const userId = member.user.id;
      
      if (!unifiedData[email]) {
        // Try to get enhanced user data if available
        const enhancedUserData = userId && additionalUserData[userId] ? additionalUserData[userId] : null;
        
        // Use enhanced data if available, otherwise use member data
        const name = enhancedUserData?.name ||
                    (member.user.name && member.user.name !== 'Unknown' ? member.user.name : '');
        const username = enhancedUserData?.username || member.user.username || '';
        
        unifiedData[email] = {
          email,
          name: name || username || 'Unknown',
          username: username,
          whopId: userId,
          whopData: {
            member,
            payments: [],
            memberships: [],
            enhancedUserData: enhancedUserData
          },
          sheetData: [],
          totalSpentWhop: 0,
          totalSpentWhopBeforeFees: 0,
          totalSpentSheet: 0,
          lastPaymentDate: null,
          source: ['Whop']
        };
      }
    });
    
    // 4.1 Ensure all users with additional data are included even if they're not in members/payments/memberships
    Object.entries(additionalUserData).forEach(([userId, userData]) => {
      if (!userData.email) return;
      
      const email = userData.email.toLowerCase().trim();
      if (!unifiedData[email]) {
        // console.log(`Adding user from additional data: ${userData.email} (${userId})`);
        unifiedData[email] = {
          email,
          name: userData.name || userData.username || 'Unknown',
          username: userData.username || '',
          whopId: userId,
          whopData: {
            member: null,
            payments: [],
            memberships: [],
            enhancedUserData: userData
          },
          sheetData: [],
          totalSpentWhop: 0,
          totalSpentWhopBeforeFees: 0,
          totalSpentSheet: 0,
          lastPaymentDate: null,
          source: ['Whop']
        };
      }
    });

    // Process Sheet Data
    let sheetDataToProcess = (sheetResult.success && sheetResult.data) ? sheetResult.data : [];
    
    // Optimization: Filter sheet data by email if search is active
    if (search) {
      const searchLower = search.toLowerCase();
      sheetDataToProcess = sheetDataToProcess.filter((row: any) => 
        (row.contactEmail && row.contactEmail.toLowerCase().includes(searchLower)) ||
        (row.altEmail && row.altEmail.toLowerCase().includes(searchLower)) ||
        (row.contactName && row.contactName.toLowerCase().includes(searchLower)) ||
        (row.bookingName && row.bookingName.toLowerCase().includes(searchLower))
      );
    }

    if (startDate || endDate) {
      const start = startDate ? new Date(startDate).getTime() : 0;
      const end = endDate ? new Date(endDate).getTime() : Infinity;
      sheetDataToProcess = sheetDataToProcess.filter((row: any) => {
        let rowDate = 0;
        if (row.date) {
          const serial = parseFloat(row.date);
          if (!isNaN(serial) && serial > 30000 && serial < 60000) {
            rowDate = (serial - 25569) * 86400 * 1000;
          } else {
            const parsedDate = new Date(row.date);
            rowDate = isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
          }
        }
        return rowDate >= start && rowDate <= end;
      });
    }

    // Optimization: If no search and no date filter, and we already have enough data for the current page,
    // we could potentially skip processing the rest of the sheet data.
    // However, for accurate "totalSpentSheet" and "lastPaymentDate", we need to process all relevant records.
    // But we can at least limit the number of records we process if they are too many.
    if (!search && !startDate && !endDate && sheetDataToProcess.length > 5000) {
       console.log(`Limiting sheet data processing from ${sheetDataToProcess.length} to 5000 for performance`);
       sheetDataToProcess = sheetDataToProcess.slice(0, 5000);
    }

    sheetDataToProcess.forEach((row: any) => {
      const email = (row.contactEmail || row.altEmail || '').toLowerCase().trim();
      if (!email) return;

      const name = (row.contactName || row.bookingName || '').trim();

      let sheetDate = 0;
      if (row.date) {
        // Handle Excel/Google Sheets serial numbers
        const serial = parseFloat(row.date);
        if (!isNaN(serial) && serial > 30000 && serial < 60000) {
          // 25569 is the offset between Unix epoch and Excel epoch
          // 86400 is seconds in a day
          sheetDate = (serial - 25569) * 86400 * 1000;
        } else {
          const parsedDate = new Date(row.date);
          sheetDate = isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
        }
      }

      if (unifiedData[email]) {
        // Merge sheet data into existing Whop user
        unifiedData[email].sheetData.push(row);
        const amount = parseFloat(row.amount.replace(/[^0-9.-]+/g, '')) || 0;
        unifiedData[email].totalSpentSheet += Math.max(0, amount);
        if (!unifiedData[email].source.includes('Sheet')) {
          unifiedData[email].source.push('Sheet');
        }
        if (!unifiedData[email].lastPaymentDate || sheetDate > unifiedData[email].lastPaymentDate) {
          unifiedData[email].lastPaymentDate = sheetDate;
        }
        // If the Whop user has no name or is 'Unknown', use the sheet name
        if (name && (!unifiedData[email].name || unifiedData[email].name === 'Unknown')) {
          unifiedData[email].name = name;
        }
      } else {
        const amount = parseFloat(row.amount.replace(/[^0-9.-]+/g, '')) || 0;
        // Create new entry from sheet
        unifiedData[email] = {
          email,
          name: name || 'Unknown',
          username: '',
          whopId: '',
          whopData: {
            member: null,
            payments: [],
            memberships: []
          },
          sheetData: [row],
          totalSpentWhop: 0,
          totalSpentWhopBeforeFees: 0,
          totalSpentSheet: Math.max(0, amount),
          lastPaymentDate: sheetDate,
          source: ['Sheet']
        };
      }
    });

    // Process Pipeline Data
    let pipelineDataToProcess = (pipelineResult.success && pipelineResult.data) ? pipelineResult.data : [];
    
    // Optimization: Filter pipeline data by email if search is active, or limit it
    if (search) {
      const searchLower = search.toLowerCase();
      pipelineDataToProcess = pipelineDataToProcess.filter((row: any) => 
        (row.email && row.email.toLowerCase().includes(searchLower)) ||
        (row.name && row.name.toLowerCase().includes(searchLower))
      );
    }

    if (startDate || endDate) {
      const start = startDate ? new Date(startDate).getTime() : 0;
      const end = endDate ? new Date(endDate).getTime() : Infinity;
      pipelineDataToProcess = pipelineDataToProcess.filter((row: any) => {
        let rowDate = 0;
        if (row.date) {
          const serial = parseFloat(row.date);
          if (!isNaN(serial) && serial > 30000 && serial < 60000) {
            rowDate = (serial - 25569) * 86400 * 1000;
          } else {
            const parsedDate = new Date(row.date);
            rowDate = isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime();
          }
        }
        return rowDate >= start && rowDate <= end;
      });
    }

    // Optimization: If no search and no date filter, we still might want to limit pipeline data processing
    // since we have 13k+ records and we only show paginated results.
    // However, we need to merge them all to get accurate "source" and "pipelineData" for users.
    // But if the user is only looking for "financial data" (Whop/Sheet), 
    // we can skip pipeline-only users if they are too many.
    if (!search && !startDate && !endDate && pipelineDataToProcess.length > 2000) {
      console.log(`Limiting pipeline data processing from ${pipelineDataToProcess.length} to 2000 for performance`);
      pipelineDataToProcess = pipelineDataToProcess.slice(0, 2000);
    }
    
    pipelineDataToProcess.forEach((row: any) => {
      const email = (row.email || '').toLowerCase().trim();
      if (!email) return;

      const name = (row.name || '').trim();

      if (unifiedData[email]) {
        // Merge pipeline data into existing user
        if (!unifiedData[email].pipelineData) {
          unifiedData[email].pipelineData = [];
        }
        unifiedData[email].pipelineData.push(row);
        if (!unifiedData[email].source.includes('Pipeline')) {
          unifiedData[email].source.push('Pipeline');
        }
        // If the user has no name or is 'Unknown', use the pipeline name
        if (name && (!unifiedData[email].name || unifiedData[email].name === 'Unknown')) {
          unifiedData[email].name = name;
        }
      } else {
        // Create new entry from pipeline
        unifiedData[email] = {
          email,
          name: name || 'Unknown',
          username: '',
          whopId: '',
          whopData: {
            member: null,
            payments: [],
            memberships: []
          },
          sheetData: [],
          pipelineData: [row],
          totalSpentWhop: 0,
          totalSpentWhopBeforeFees: 0,
          totalSpentSheet: 0,
          source: ['Pipeline']
        };
      }
    });

    // Return all data (Company 2 + Sheet + Pipeline)
    let finalData = Object.values(unifiedData);

    // Apply search filter server-side
    if (search) {
      const searchLower = search.toLowerCase();
      finalData = finalData.filter(user =>
        (user.email && user.email.toLowerCase().includes(searchLower)) ||
        (user.name && user.name.toLowerCase().includes(searchLower)) ||
        (user.username && user.username.toLowerCase().includes(searchLower))
      );
    }

    // Apply "has financial data" filter server-side (as done in the component)
    finalData = finalData.filter(user => {
      const hasWhopActivity = (user.totalSpentWhop > 0) ||
                             (user.whopData?.payments && user.whopData.payments.length > 0) ||
                             (user.whopData?.memberships && user.whopData.memberships.length > 0);
      const hasSheetActivity = (user.totalSpentSheet > 0) ||
                              (user.sheetData && user.sheetData.length > 0);
      
      return hasWhopActivity || hasSheetActivity;
    });

    // Sort by lastPaymentDate desc by default
    finalData.sort((a, b) => (b.lastPaymentDate || 0) - (a.lastPaymentDate || 0));

    const totalCount = finalData.length;
    const paginatedData = finalData.slice(offset, offset + limit);

    // 5. Fetch GHL data for the paginated results only (Efficient approach)
    if (ghlToken && ghlLocationId && paginatedData.length > 0) {
      console.log(`Fetching GHL data for ${paginatedData.length} paginated users...`);
      console.log(`Using Location ID: ${ghlLocationId}`);
      console.log(`Token starts with: ${ghlToken.substring(0, 10)}...`);
    } else {
      console.log('Skipping GHL fetch:', { 
        hasToken: !!ghlToken, 
        hasLocationId: !!ghlLocationId, 
        dataLength: paginatedData.length 
      });
    }

    if (ghlToken && ghlLocationId && paginatedData.length > 0) {
      // Fetch custom fields schema and users once for the batch
let customFields: any[] = [];
      let ghlUsers: any[] = [];
      try {
        console.log('Fetching GHL metadata (custom fields and users)...');
        const [cfResponse, usersResponse] = await Promise.all([
          fetch(`https://services.leadconnectorhq.com/locations/${ghlLocationId}/custom-fields`, {
            headers: {
              'Authorization': `Bearer ${ghlToken}`,
              'Version': '2021-07-28',
              'Accept': 'application/json'
            }
          }),
          fetch(`https://services.leadconnectorhq.com/users/?locationId=${ghlLocationId}`, {
            headers: {
              'Authorization': `Bearer ${ghlToken}`,
              'Version': '2021-07-28',
              'Accept': 'application/json'
            }
          })
        ]);

        if (cfResponse.ok) {
          const cfData = await cfResponse.json();
          customFields = cfData.customFields || [];
          console.log(`Fetched ${customFields.length} custom fields`);
        } else {
          const errorText = await cfResponse.text();
          console.error(`Failed to fetch custom fields: ${cfResponse.status}`, errorText);
        }
        
        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          ghlUsers = usersData.users || [];
          console.log(`Fetched ${ghlUsers.length} GHL users`);
        } else {
          const errorText = await usersResponse.text();
          console.error(`Failed to fetch GHL users: ${usersResponse.status}`, errorText);
        }
      } catch (err) {
        console.error('Error fetching GHL metadata:', err);
      }

      // Use a more efficient search endpoint if possible, or parallelize with a limit
      const BATCH_SIZE = 5; // Process in small batches to avoid hitting rate limits too hard
      for (let i = 0; i < paginatedData.length; i += BATCH_SIZE) {
        const batch = paginatedData.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (user: any) => {
          try {
            // Try searching by email specifically using the contacts search endpoint with filters
            const response = await fetch(`https://services.leadconnectorhq.com/contacts/search`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${ghlToken}`,
                'Version': '2021-07-28',
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                locationId: ghlLocationId,
                pageLimit: 1,
                filters: [
                  {
                    field: 'email',
                    operator: 'eq',
                    value: user.email
                  }
                ]
              })
            });
            
            if (response.ok) {
              const data = await response.json();
              const contact = data.contacts?.[0];
              if (contact) {
                console.log(`Found GHL contact for ${user.email}: ${contact.id}`);
                // Fetch opportunities for this contact
                const oppResponse = await fetch(`https://services.leadconnectorhq.com/opportunities/search?location_id=${ghlLocationId}&contact_id=${contact.id}`, {
                  headers: {
                    'Authorization': `Bearer ${ghlToken}`,
                    'Version': '2021-07-28',
                    'Accept': 'application/json'
                  }
                });
                const oppData = oppResponse.ok ? await oppResponse.json() : { opportunities: [] };
                
                // Ensure opportunities is always an array
                const opportunities = Array.isArray(oppData.opportunities) ? oppData.opportunities : [];
                console.log(`Opportunities for ${user.email}:`, opportunities.length);

                // Fetch pipelines for stage name resolution
                const pipelinesResponse = await fetch(`https://services.leadconnectorhq.com/opportunities/pipelines?locationId=${ghlLocationId}`, {
                  headers: {
                    'Authorization': `Bearer ${ghlToken}`,
                    'Version': '2021-07-28',
                    'Accept': 'application/json'
                  }
                });
                const pipelinesData = pipelinesResponse.ok ? await pipelinesResponse.json() : { pipelines: [] };
                const pipelines = Array.isArray(pipelinesData.pipelines) ? pipelinesData.pipelines : [];
                
                // Debug log for pipelines
                if (i === 0) {
                  console.log(`Pipelines fetched: ${pipelines.length}`);
                }

                user.ghlData = {
                  contact,
                  opportunities: opportunities,
                  customFieldsSchema: customFields,
                  ghlUsers: ghlUsers,
                  pipelines: pipelines
                };

                // Add direct access to active opportunity data for easier UI rendering
                const activeOpp = opportunities.find((o: any) => o.status === 'open') || opportunities[0];
                
                // Debug log to see what we're getting
                console.log(`GHL Data for ${user.email}:`, {
                  hasContact: !!contact,
                  contactId: contact.id,
                  oppCount: opportunities.length,
                  activeOppId: activeOpp?.id,
                  pipelineCount: pipelines.length
                });
                console.log(`GHL Full Contact for ${user.email}:`, JSON.stringify(contact, null, 2));
                if (opportunities.length > 0) {
                  console.log(`GHL Opportunities for ${user.email}:`, JSON.stringify(opportunities, null, 2));
                }

                if (activeOpp) {
                  user.ghlActiveOpp = activeOpp;
                  const pipeline = pipelines.find((p: any) => p.id === activeOpp.pipelineId);
                  const stage = pipeline?.stages?.find((s: any) => s.id === activeOpp.pipelineStageId);
                  
                  user.ghlStageName = stage ? stage.name : 'Unknown';
                  user.ghlPipelineName = pipeline ? pipeline.name : 'Unknown';
                  
                  const assignedToId = activeOpp.assignedTo || contact.assignedTo;
                  const assignedUser = ghlUsers.find((u: any) => u.id === assignedToId);
                  user.ghlAssignedToName = assignedUser ? (assignedUser.name || `${assignedUser.firstName} ${assignedUser.lastName}`) : 'Unknown';
                } else {
                  user.ghlStageName = '-';
                  user.ghlPipelineName = '-';
                  const assignedToId = contact.assignedTo;
                  const assignedUser = ghlUsers.find((u: any) => u.id === assignedToId);
                  user.ghlAssignedToName = assignedUser ? (assignedUser.name || `${assignedUser.firstName} ${assignedUser.lastName}`) : 'Unassigned';
                }

                if (!user.source.includes('GHL')) {
                  user.source.push('GHL');
                }
                const ghlName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
                if (ghlName && (!user.name || user.name === 'Unknown')) {
                  user.name = ghlName;
                }
              } else {
                console.log(`No GHL contact found for ${user.email}`);
              }
            } else {
              const errorText = await response.text();
              console.error(`GHL Search API error for ${user.email}: ${response.status}`, errorText);
            }
          } catch (err) {
            console.error(`Error fetching GHL contact for ${user.email}:`, err);
          }
        }));
      }
    }

    return {
      success: true,
      data: paginatedData,
      totalCount,
      hasMore: offset + limit < totalCount
    };
  } catch (error: any) {
    console.error('Error fetching unified data:', error);
    
    // Enhanced error reporting with more context
    let errorMessage = 'Failed to fetch unified data';
    let errorDetails = '';
    
    if (error.message) {
      errorMessage = error.message;
    }
    
    if (error.code) {
      errorDetails += `Error code: ${error.code}. `;
    }
    
    if (error.stack) {
      // Log the stack trace but don't return it to the client
      console.error('Stack trace:', error.stack);
    }
    
    // Add information about what was successfully fetched before the error
    if (typeof members2 !== 'undefined') {
      errorDetails += `Successfully fetched ${members2.length} members. `;
    }
    
    if (typeof payments2 !== 'undefined') {
      errorDetails += `Successfully fetched ${payments2.length} payments. `;
    }
    
    if (typeof memberships2 !== 'undefined') {
      errorDetails += `Successfully fetched ${memberships2.length} memberships. `;
    }
    
    return {
      success: false,
      error: errorMessage,
      errorDetails: errorDetails || undefined
    };
  }
}

export async function getGhlContactByEmail(email: string) {
  try {
    const locationId = process.env.LOCATION_ID;
    const accessToken = process.env.GHL_ACCESS_TOKEN;

    if (!locationId) {
      throw new Error('LOCATION_ID is not defined in environment variables');
    }

    // Using the contacts/search endpoint with a filter
    const response = await fetch(`https://services.leadconnectorhq.com/contacts/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Version': '2021-07-28',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
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

    if (!response.ok) {
      let errorMessage = `GHL API error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If response is not JSON
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return {
      success: true,
      contact: data.contacts?.[0] || null
    };
  } catch (error: any) {
    console.error('Error fetching GHL contact:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch GHL contact'
    };
  }
}

// Main Server Action to get cash collected data
export async function getCashCollectedData(spreadsheetUrl?: string) {
  // Default URL if not provided
  const defaultUrl = 'https://docs.google.com/spreadsheets/d/19iD_NQgdNL10GucK6ZDHN91mtRtOktNT8KX37mLd15s/edit?gid=1877425889#gid=1877425889';
  const url = spreadsheetUrl || defaultUrl;

  try {
    // Path to service account key file
    const keyPath = path.join(process.cwd(), 'halalceo-dashboard-c0bc71995e29.json');
    
    // Check if key file exists
    if (!fs.existsSync(keyPath)) {
      throw new Error('Service account key file not found: halalceo-dashboard-c0bc71995e29.json');
    }

    // Read and parse credentials
    const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

    // Create Google Auth with JWT
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    // Extract spreadsheetId from URL using regex
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!match) {
      throw new Error('Invalid Google Sheet URL: Unable to extract spreadsheetId');
    }
    const spreadsheetId = match[1];

    // Create Sheets API client
    const sheets = google.sheets({ version: 'v4', auth });

    // Read all data from 'Cash Collected!A:Z'
    const range = 'Cash Collected!A:Z';
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      throw new Error('No data found in the sheet');
    }

    // First row as headers
    const rawHeaders = rows[0].map((h: string) => h.trim());
    
    // Required columns
    const requiredColumns = [
      'Date', 'Type', 'Contact Name', 'Contact Email', 'Alt Email',
      'Amount', 'Portal', 'Platform', 'Recurring', 'Closer',
      'Notes', 'Unique', 'AVG', 'LeadFi', 'Booking Name',
      'Setter', 'Manual Closer', 'CSM'
    ];

    // Map headers to indices, handling duplicate column names by taking the last occurrence
    // (since the first 'Date' column might be empty or less reliable than the second)
    const headerIndices = requiredColumns.map(col => {
      const index = rawHeaders.lastIndexOf(col);
      return { name: col, index };
    });

    // Convert rows to array of objects with only required columns
    const data = rows.slice(1).map((row: any[]) => {
      const obj: any = {};
      headerIndices.forEach(({ name, index }) => {
        if (index !== -1) {
          obj[toCamelCase(name)] = row[index] || '';
        } else {
          obj[toCamelCase(name)] = '';
        }
      });
      return obj;
    });

    // For large datasets, limit to 5000 rows for performance (increased from 1000)
    const maxRows = 5000;
    const limitedData = data.slice(0, maxRows);

    return {
      success: true,
      data: limitedData,
      totalRows: data.length,
      displayedRows: limitedData.length,
    };
  } catch (error: any) {
    console.error('Error reading Google Sheet:', error);
    
    // Specific error handling
    let errorMessage = 'Unknown error occurred';
    if (error.code === 403) {
      errorMessage = 'Access denied: Check service account permissions';
    } else if (error.code === 404) {
      errorMessage = 'Sheet not found: Verify the URL and sheet name';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function getPipelineStageData(spreadsheetUrl?: string) {
  const defaultUrl = 'https://docs.google.com/spreadsheets/d/19iD_NQgdNL10GucK6ZDHN91mtRtOktNT8KX37mLd15s/edit?gid=1877425889#gid=1877425889';
  const url = spreadsheetUrl || defaultUrl;

  try {
    const keyPath = path.join(process.cwd(), 'halalceo-dashboard-c0bc71995e29.json');
    if (!fs.existsSync(keyPath)) {
      throw new Error('Service account key file not found');
    }

    const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!match) throw new Error('Invalid Google Sheet URL');
    const spreadsheetId = match[1];

    const sheets = google.sheets({ version: 'v4', auth });
    const range = 'Pipeline stage data!A:G';
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return { success: true, data: [] };
    }

    const rawHeaders = rows[0];
    const requiredColumns = ['Date', 'Name', 'Email', 'Stage', 'Status', 'Closer', 'Pipeline Name'];
    
    const headerIndices = requiredColumns.map(col => ({
      name: col,
      index: rawHeaders.findIndex((h: string) => h.trim().toLowerCase() === col.toLowerCase())
    }));

    const data = rows.slice(1).map((row: any[]) => {
      const obj: any = {};
      headerIndices.forEach(({ name, index }) => {
        const camelName = toCamelCase(name);
        obj[camelName] = index !== -1 ? row[index] || '' : '';
      });
      return obj;
    });

    return {
      success: true,
      data: data,
    };
  } catch (error: any) {
    console.error('Error reading Pipeline Stage data:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch pipeline data',
    };
  }
}