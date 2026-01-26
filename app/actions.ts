'use server';

// Import necessary modules
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

// Helper function to convert string to camelCase
function toCamelCase(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase());
}

// Main Server Action to get cash collected data
export async function getCashCollectedData(spreadsheetUrl?: string) {
  // Default URL if not provided
  const defaultUrl = 'https://docs.google.com/spreadsheets/d/1cW14pzMaxtoQR5zQhM2vn5y1eRO-uS43LuiksCYCoRc/edit?usp=sharing';
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

    // First row as headers, convert to camelCase
    const headers = rows[0].map((h: string) => toCamelCase(h));

    // Convert rows to array of objects
    const data = rows.slice(1).map((row: any[]) =>
      Object.fromEntries(headers.map((h, i) => [h, row[i] || '']))
    );

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