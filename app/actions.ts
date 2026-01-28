'use server';

// Import necessary modules
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { getMembers, getPayments, getMemberships } from '@/lib/whop/fetchers';
import { WhopMember, WhopPayment, WhopMembership } from '@/types';

// Helper function to convert string to camelCase
function toCamelCase(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase());
}

export async function getUnifiedUserData() {
  try {
    const COMPANY_2_ID = 'biz_qcxyUyVWg1WZ7P';

    // 1. Fetch Whop Data for Company 2 only
    const [
      members2, payments2, memberships2
    ] = await Promise.all([
      getMembers(COMPANY_2_ID),
      getPayments(COMPANY_2_ID),
      getMemberships(COMPANY_2_ID)
    ]);

    // 2. Fetch Sheet Data
    const [sheetResult, pipelineResult] = await Promise.all([
      getCashCollectedData(),
      getPipelineStageData()
    ]);
    const sheetData = sheetResult.success ? sheetResult.data : [];
    const pipelineData = pipelineResult.success ? pipelineResult.data : [];

    // 3. Combine Data by Email
    const unifiedData: Record<string, any> = {};

    // Helper to process Whop data
    const processWhopData = (members: WhopMember[], payments: WhopPayment[], memberships: WhopMembership[], companyLabel: string) => {
      members.forEach((member: WhopMember) => {
        if (!member.user || !member.user.email) return;
        const email = member.user.email.toLowerCase().trim();
        const name = member.user.name && member.user.name !== 'Unknown' ? member.user.name : '';

        if (!unifiedData[email]) {
          unifiedData[email] = {
            email,
            name: name || member.user.username || 'Unknown',
            username: member.user.username,
            whopId: member.user.id,
            whopData: {
              member,
              payments: [],
              memberships: []
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
        const name = payment.user.name && payment.user.name !== 'Unknown' ? payment.user.name : '';
        
        const paymentDate = payment.created_at ? new Date(payment.created_at).getTime() : 0;

        if (!unifiedData[email]) {
          const amount = payment.amount_after_fees || payment.usd_total;
          const amountBefore = payment.usd_total;
          const refunded = payment.refunded_amount || 0;
          unifiedData[email] = {
            email,
            name: name || payment.user.username || 'Unknown',
            username: payment.user.username || '',
            whopId: payment.user.id || '',
            whopData: {
              member: null,
              payments: [payment],
              memberships: []
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
        const name = membership.user.name && membership.user.name !== 'Unknown' ? membership.user.name : '';
        
        if (!unifiedData[email]) {
          unifiedData[email] = {
            email,
            name: name || membership.user.username || 'Unknown',
            username: membership.user.username || '',
            whopId: membership.user.id || '',
            whopData: {
              member: null,
              payments: [],
              memberships: [membership]
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
    processWhopData(members2, payments2, memberships2, 'Whop');

    // Process Sheet Data
    const sheetDataToProcess = (sheetResult.success && sheetResult.data) ? sheetResult.data : [];
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
    const pipelineDataToProcess = (pipelineResult.success && pipelineResult.data) ? pipelineResult.data : [];
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
    const finalData = Object.values(unifiedData);

    return {
      success: true,
      data: finalData
    };
  } catch (error: any) {
    console.error('Error fetching unified data:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch unified data'
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
    const rawHeaders = rows[0];
    
    // Required columns
    const requiredColumns = [
      'Date', 'Type', 'Contact Name', 'Contact Email', 'Alt Email', 
      'Amount', 'Portal', 'Platform', 'Recurring', 'Closer', 
      'Notes', 'Unique', 'AVG', 'LeadFi', 'Booking Name', 
      'Setter', 'Manual Closer', 'CSM'
    ];

    // Map headers to indices
    const headerIndices = requiredColumns.map(col => {
      const index = rawHeaders.findIndex((h: string) => h.trim() === col);
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

    // For large datasets, limit to 1000 rows for performance
    const maxRows = 1000;
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
