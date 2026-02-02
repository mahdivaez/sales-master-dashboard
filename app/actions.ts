'use server';

// Import necessary modules
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { cache } from 'react';
import { getMembers, getPayments, getMemberships, getAllUniqueUsers, getUser } from '@/lib/whop/fetchers';
import { WhopMember, WhopPayment, WhopMembership } from '@/types';

// Configuration Constants
const CONFIG = {
  WHOP_MAX_PAGES: 200,
  GHL_BATCH_SIZE: 10,
  USER_FETCH_DELAY: 50, // ms
  SHEET_DATA_LIMIT: 5000,
  PIPELINE_DATA_LIMIT: 2000,
  API_TIMEOUT: 15000, // 15s
  CACHE_TTL: 5 * 60 * 1000, // 5 min
  GHL_METADATA_TTL: 15 * 60 * 1000, // 15 min
};

// Simple In-Memory Cache
const globalCache: Record<string, { data: any; timestamp: number; ttl: number }> = {};

function getCachedData(key: string) {
  const cached = globalCache[key];
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }
  return null;
}

function setCachedData(key: string, data: any, ttl: number = CONFIG.CACHE_TTL) {
  globalCache[key] = { data, timestamp: Date.now(), ttl };
}

async function getGHLMetadata(ghlToken: string, ghlLocationId: string) {
  const cacheKey = `ghl_metadata_${ghlLocationId}`;
  const cached = getCachedData(cacheKey);
  if (cached) return cached;

  console.log('Fetching GHL metadata (custom fields, users, and pipelines)...');
  const [cfResponse, usersResponse, pipelinesResponse] = await Promise.all([
    fetch(`https://services.leadconnectorhq.com/locations/${ghlLocationId}/custom-fields`, {
      headers: {
        'Authorization': `Bearer ${ghlToken}`,
        'Version': '2021-07-28',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }),
    fetch(`https://services.leadconnectorhq.com/users/?locationId=${ghlLocationId}`, {
      headers: {
        'Authorization': `Bearer ${ghlToken}`,
        'Version': '2021-07-28',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }),
    fetch(`https://services.leadconnectorhq.com/opportunities/pipelines?locationId=${ghlLocationId}`, {
      headers: {
        'Authorization': `Bearer ${ghlToken}`,
        'Version': '2021-07-28',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })
  ]);

  const [cfData, usersData, pipelinesData] = await Promise.all([
    cfResponse.ok ? cfResponse.json() : { customFields: [] },
    usersResponse.ok ? usersResponse.json() : { users: [] },
    pipelinesResponse.ok ? pipelinesResponse.json() : { pipelines: [] }
  ]);

  const metadata = {
    customFields: cfData.customFields || [],
    users: usersData.users || [],
    pipelines: pipelinesData.pipelines || []
  };

  setCachedData(cacheKey, metadata, CONFIG.GHL_METADATA_TTL);
  return metadata;
}

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
  electiveData?: any[];
} = {}) {
  const { limit = 50, offset = 0, search = '', startDate, endDate, electiveData = [] } = options;
  
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
  let sheetData: any[] = [];
  let pipelineData: any[] = [];
  let additionalUserData: Record<string, any> = {};
  
  try {
    const COMPANY_2_ID = 'biz_qcxyUyVWg1WZ7P';
    console.log('Starting unified data fetch process with options:', options);

    // 1. Fetch Whop Data for Company 2 only
    console.log('Fetching Whop data for company ID:', COMPANY_2_ID);
    
    // Global tracking for duplicate detection
    const globalTracking = {
      memberIds: new Set<string>(),
      paymentIds: new Set<string>(),
      membershipIds: new Set<string>()
    };

    const whopResults = await Promise.allSettled([
      getMembers(COMPANY_2_ID, undefined, globalTracking.memberIds),
      getPayments(COMPANY_2_ID, undefined, globalTracking.paymentIds),
      getMemberships(COMPANY_2_ID, undefined, globalTracking.membershipIds)
    ]);

    members2 = whopResults[0].status === 'fulfilled' ? whopResults[0].value as WhopMember[] : [];
    payments2 = whopResults[1].status === 'fulfilled' ? whopResults[1].value as WhopPayment[] : [];
    memberships2 = whopResults[2].status === 'fulfilled' ? whopResults[2].value as WhopMembership[] : [];

    if (whopResults.some(r => r.status === 'rejected')) {
      console.warn('Some Whop data fetches failed:', whopResults.filter(r => r.status === 'rejected'));
    }

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

    // 1.1 Fetch additional user data - DEFERRED until after initial merge and pagination
    // We will only fetch additional data for users on the current page to save hundreds of API calls.

    // 2. Fetch Sheet Data
    console.log('Fetching sheet and pipeline data...');
    
    const sheetCacheKey = 'google_sheet_data';
    const pipelineCacheKey = 'google_pipeline_data';
    
    sheetData = getCachedData(sheetCacheKey) || [];
    pipelineData = getCachedData(pipelineCacheKey) || [];
    
    if (sheetData.length === 0 || pipelineData.length === 0) {
      const results = await Promise.allSettled([
        sheetData.length === 0 ? getCashCollectedData() : Promise.resolve({ success: true, data: sheetData }),
        pipelineData.length === 0 ? getPipelineStageData() : Promise.resolve({ success: true, data: pipelineData })
      ]);
      
      if (results[0].status === 'fulfilled') {
        const res = results[0].value as any;
        if (res.success) {
          sheetData = res.data;
          setCachedData(sheetCacheKey, sheetData);
        }
      }
      if (results[1].status === 'fulfilled') {
        const res = results[1].value as any;
        if (res.success) {
          pipelineData = res.data;
          setCachedData(pipelineCacheKey, pipelineData);
        }
      }
    }
    
    console.log(`Sheet data fetch complete: ${sheetData?.length || 0} sheet records, ${pipelineData?.length || 0} pipeline records`);

    // 3. Combine Data by Email
    console.log('Beginning data merging process...');
    const unifiedData: Record<string, any> = {};
    
    // Global tracking for duplicate detection
    const tracking = {
      memberIds: new Set<string>(),
      paymentIds: new Set<string>(),
      membershipIds: new Set<string>()
    };

    // Helper to process Whop data
    const processWhopData = (
      members: WhopMember[],
      payments: WhopPayment[],
      memberships: WhopMembership[],
      companyLabel: string,
      additionalUserData: Record<string, any> = {}
    ) => {
      console.log(`Processing ${members.length} members for ${companyLabel}`);
      members.forEach((member: WhopMember) => {
        const userObj = member.user || (member as any).user_data;
        if (!userObj || !userObj.email || tracking.memberIds.has(member.id)) return;
        tracking.memberIds.add(member.id);
        
        const email = userObj.email.toLowerCase().trim();
        const userId = userObj.id;
        
        // Try to get enhanced user data if available
        const enhancedUserData = userId && additionalUserData[userId] ? additionalUserData[userId] : null;
        
        // Use enhanced data if available, otherwise use member data
        const name = enhancedUserData?.name ||
                    (userObj.name && userObj.name !== 'Unknown' ? userObj.name : '');
        const username = enhancedUserData?.username || userObj.username || '';

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
          if (!unifiedData[email].whopData.member) {
            unifiedData[email].whopData.member = member;
            unifiedData[email].whopId = userObj.id;
            if (name) unifiedData[email].name = name;
            unifiedData[email].username = userObj.username;
          }
        }
      });

      console.log(`Processing ${payments.length} payments for ${companyLabel}`);
      payments.forEach((payment: WhopPayment) => {
        const userObj = payment.user || (payment as any).user_data;
        if (!userObj || !userObj.email || tracking.paymentIds.has(payment.id)) return;
        tracking.paymentIds.add(payment.id);
        
        const email = userObj.email.toLowerCase().trim();
        const userId = userObj.id;
        
        // Try to get enhanced user data if available
        const enhancedUserData = userId && additionalUserData[userId] ? additionalUserData[userId] : null;
        
        // Use enhanced data if available, otherwise use payment data
        const name = enhancedUserData?.name ||
                    (userObj.name && userObj.name !== 'Unknown' ? userObj.name : '');
        const username = enhancedUserData?.username || userObj.username || '';
        
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
          
          // Double check for duplicate payment in the user's array
          const paymentExists = unifiedData[email].whopData.payments.some((p: any) => p.id === payment.id);
          if (!paymentExists) {
            unifiedData[email].whopData.payments.push(payment);
            if (payment.substatus === 'succeeded' || payment.substatus === 'resolution_won') {
              const amount = payment.amount_after_fees || payment.usd_total;
              const amountBefore = payment.usd_total;
              const refunded = payment.refunded_amount || 0;
              unifiedData[email].totalSpentWhop += Math.max(0, amount - refunded);
              unifiedData[email].totalSpentWhopBeforeFees += Math.max(0, amountBefore - refunded);
            }
          }
          
          if (name && (!unifiedData[email].name || unifiedData[email].name === 'Unknown')) {
            unifiedData[email].name = name;
          }
          if (!unifiedData[email].lastPaymentDate || paymentDate > unifiedData[email].lastPaymentDate) {
            unifiedData[email].lastPaymentDate = paymentDate;
          }
        }
      });

      console.log(`Processing ${memberships.length} memberships for ${companyLabel}`);
      memberships.forEach((membership: WhopMembership) => {
        const userObj = membership.user || (membership as any).user_data;
        if (!userObj || !userObj.email || tracking.membershipIds.has(membership.id)) return;
        tracking.membershipIds.add(membership.id);
        
        const email = userObj.email.toLowerCase().trim();
        const userId = userObj.id;
        
        // Try to get enhanced user data if available
        const enhancedUserData = userId && additionalUserData[userId] ? additionalUserData[userId] : null;
        
        // Use enhanced data if available, otherwise use membership data
        const name = enhancedUserData?.name ||
                    (userObj.name && userObj.name !== 'Unknown' ? userObj.name : '');
        const username = enhancedUserData?.username || userObj.username || '';
        
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
          
          // Double check for duplicate membership in the user's array
          const membershipExists = unifiedData[email].whopData.memberships.some((m: any) => m.id === membership.id);
          if (!membershipExists) {
            unifiedData[email].whopData.memberships.push(membership);
          }
          
          if (name && (!unifiedData[email].name || unifiedData[email].name === 'Unknown')) {
            unifiedData[email].name = name;
          }
        }
      });
    };

    // Process only Company 2
    processWhopData(members2, payments2, memberships2, 'Whop', {});

    // 4. Ensure all members are included even if they have no payments/memberships in the fetched lists
    members2.forEach((member: WhopMember) => {
      const userObj = member.user || (member as any).user_data;
      if (!userObj || !userObj.email) return;
      const email = userObj.email.toLowerCase().trim();
      const userId = userObj.id;
      
      if (!unifiedData[email]) {
        const name = (userObj.name && userObj.name !== 'Unknown' ? userObj.name : '');
        const username = userObj.username || '';
        
        unifiedData[email] = {
          email,
          name: name || username || 'Unknown',
          username: username,
          whopId: userId,
          whopData: {
            member,
            payments: [],
            memberships: [],
            enhancedUserData: null
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
    let sheetDataToProcess = sheetData;
    
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
    if (!search && !startDate && !endDate && sheetDataToProcess.length > CONFIG.SHEET_DATA_LIMIT) {
       console.log(`Limiting sheet data processing from ${sheetDataToProcess.length} to ${CONFIG.SHEET_DATA_LIMIT} for performance`);
       sheetDataToProcess = sheetDataToProcess.slice(0, CONFIG.SHEET_DATA_LIMIT);
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
        unifiedData[email].totalSpentSheet += amount;
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
          totalSpentSheet: amount,
          lastPaymentDate: sheetDate,
          source: ['Sheet']
        };
      }
    });

    // Process Pipeline Data
    let pipelineDataToProcess = pipelineData;
    
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
    if (!search && !startDate && !endDate && pipelineDataToProcess.length > CONFIG.PIPELINE_DATA_LIMIT) {
      console.log(`Limiting pipeline data processing from ${pipelineDataToProcess.length} to ${CONFIG.PIPELINE_DATA_LIMIT} for performance`);
      pipelineDataToProcess = pipelineDataToProcess.slice(0, CONFIG.PIPELINE_DATA_LIMIT);
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

    // Process Elective Data
    if (electiveData && electiveData.length > 0) {
      console.log(`Processing ${electiveData.length} elective records...`);
      electiveData.forEach((row: any) => {
        const email = (row.customerEmail || '').toLowerCase().trim();
        if (!email) return;

        const name = (row.customerName || '').trim();
        const amount = row.netAmount || 0;
        const saleDate = row.saleDate ? new Date(row.saleDate).getTime() : 0;

        if (unifiedData[email]) {
          if (!unifiedData[email].electiveData) {
            unifiedData[email].electiveData = [];
          }
          unifiedData[email].electiveData.push(row);
          unifiedData[email].totalSpentElective = (unifiedData[email].totalSpentElective || 0) + amount;
          
          if (!unifiedData[email].source.includes('Elective')) {
            unifiedData[email].source.push('Elective');
          }
          
          if (!unifiedData[email].lastPaymentDate || saleDate > unifiedData[email].lastPaymentDate) {
            unifiedData[email].lastPaymentDate = saleDate;
          }

          if (name && (!unifiedData[email].name || unifiedData[email].name === 'Unknown')) {
            unifiedData[email].name = name;
          }
        } else {
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
            pipelineData: [],
            electiveData: [row],
            totalSpentWhop: 0,
            totalSpentWhopBeforeFees: 0,
            totalSpentSheet: 0,
            totalSpentElective: amount,
            lastPaymentDate: saleDate,
            source: ['Elective']
          };
        }
      });
    }

    // Return all data (Company 2 + Sheet + Pipeline + Elective)
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
    let filteredFinalData = finalData.filter(user => {
      const hasWhopActivity = (user.totalSpentWhop > 0) ||
                             (user.whopData?.payments && user.whopData.payments.length > 0) ||
                             (user.whopData?.memberships && user.whopData.memberships.length > 0) ||
                             (user.whopData?.member);
     const hasSheetActivity = (user.totalSpentSheet > 0) ||
                             (user.sheetData && user.sheetData.length > 0);
     const hasElectiveActivity = (user.totalSpentElective > 0) ||
                                (user.electiveData && user.electiveData.length > 0);
     
     return hasWhopActivity || hasSheetActivity || hasElectiveActivity;
    });

    // Sort by lastPaymentDate desc by default
    filteredFinalData.sort((a, b) => (b.lastPaymentDate || 0) - (a.lastPaymentDate || 0));

    const totalCount = filteredFinalData.length;
    const paginatedData = filteredFinalData.slice(offset, offset + limit);

    // 5. Fetch additional Whop user data for the paginated results only (Lazy Loading)
    const usersNeedingData = paginatedData.filter(user =>
      user.whopId && !user.whopData.enhancedUserData && user.source.includes('Whop')
    );

    if (usersNeedingData.length > 0) {
      console.log(`Lazy loading additional Whop data for ${usersNeedingData.length} users on current page...`);
      const lazyUserData = await getAllUniqueUsers(
        [], // No payments needed, we already have the IDs
        [], // No memberships needed
        [], // No members needed
        COMPANY_2_ID,
        usersNeedingData.map(u => u.whopId) // Pass explicit IDs to fetch
      );

      // Merge lazy loaded data back into paginated results
      paginatedData.forEach(user => {
        if (user.whopId && lazyUserData[user.whopId]) {
          const enhanced = lazyUserData[user.whopId];
          user.whopData.enhancedUserData = enhanced;
          if (enhanced.name && (!user.name || user.name === 'Unknown')) {
            user.name = enhanced.name;
          }
          if (enhanced.username) {
            user.username = enhanced.username;
          }
        }
      });
    }

    // 6. Fetch GHL data for the paginated results only (Efficient approach)
    if (ghlToken && ghlLocationId && paginatedData.length > 0) {
      const ghlMetadata = await getGHLMetadata(ghlToken, ghlLocationId);
      const { customFields, users: ghlUsers, pipelines } = ghlMetadata;

      // Parallelize GHL fetches for the entire page with concurrency control
      const CONCURRENCY_LIMIT = CONFIG.GHL_BATCH_SIZE;
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      for (let i = 0; i < paginatedData.length; i += CONCURRENCY_LIMIT) {
        const batch = paginatedData.slice(i, i + CONCURRENCY_LIMIT);
        await Promise.all(batch.map(async (user: any) => {
          try {
            // Try searching by email specifically using the contacts search endpoint with filters
            const response = await fetch(`https://services.leadconnectorhq.com/contacts/search`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${ghlToken}`,
                'Version': '2021-07-28',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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
                // Fetch opportunities for this contact
                const oppResponse = await fetch(`https://services.leadconnectorhq.com/opportunities/search?location_id=${ghlLocationId}&contact_id=${contact.id}`, {
                  headers: {
                    'Authorization': `Bearer ${ghlToken}`,
                    'Version': '2021-07-28',
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                  }
                });
                const oppData = oppResponse.ok ? await oppResponse.json() : { opportunities: [] };
                const opportunities = Array.isArray(oppData.opportunities) ? oppData.opportunities : [];

                user.ghlData = {
                  contact,
                  opportunities: opportunities,
                  customFieldsSchema: customFields,
                  ghlUsers: ghlUsers,
                  pipelines: pipelines
                };

                // Add direct access to active opportunity data for easier UI rendering
                const activeOpp = opportunities.find((o: any) => o.status === 'open') || opportunities[0];
                
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
              }
            }
          } catch (err) {
            console.error(`Error fetching GHL contact for ${user.email}:`, err);
          }
        }));
        
        // Small delay between batches to be safe with GHL rate limits
        if (i + CONCURRENCY_LIMIT < paginatedData.length) {
          await delay(CONFIG.USER_FETCH_DELAY);
        }
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
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
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
export const getCashCollectedData = cache(async (spreadsheetUrl?: string) => {
  // Default URL if not provided
  const defaultUrl = 'https://docs.google.com/spreadsheets/d/1dKazylux_iM4LGo_1fj5hJiACZLb_fKsfFiSNdjYgx4/edit?gid=1877425889#gid=1877425889';
  const url = spreadsheetUrl || defaultUrl;

  try {
    let auth;
    
    // Try to use environment variables first (recommended for Vercel)
    if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
    } else {
      // Fallback to local JSON file for development
      const keyPath = path.join(process.cwd(), 'halalceo-dashboard-c0bc71995e29.json');
      
      if (!fs.existsSync(keyPath)) {
        throw new Error('Google Sheets credentials not found. Please set GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY environment variables, or ensure the service account key file exists locally.');
      }

      const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
      auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: credentials.client_email,
          private_key: credentials.private_key.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
    }

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
});

export const getPipelineStageData = cache(async (spreadsheetUrl?: string) => {
  const defaultUrl = 'https://docs.google.com/spreadsheets/d/19iD_NQgdNL10GucK6ZDHN91mtRtOktNT8KX37mLd15s/edit?gid=1877425889#gid=1877425889';
  const url = spreadsheetUrl || defaultUrl;

  try {
    let auth;
    
    // Try to use environment variables first
    if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
    } else {
      // Fallback to local JSON file
      const keyPath = path.join(process.cwd(), 'halalceo-dashboard-c0bc71995e29.json');
      if (!fs.existsSync(keyPath)) {
        throw new Error('Google Sheets credentials not found');
      }

      const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
      auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: credentials.client_email,
          private_key: credentials.private_key.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
    }

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
});