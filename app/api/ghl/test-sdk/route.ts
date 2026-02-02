import { NextRequest, NextResponse } from 'next/server';
import { HighLevel } from '@gohighlevel/api-client';
import { getUnifiedUserData } from '@/app/actions';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const locationId = searchParams.get('locationId') || process.env.GHL_LOCATION_ID;
  const filterUnified = searchParams.get('filterUnified') === 'true';
  
  const highLevel = new HighLevel({
    clientId: process.env.HIGHLEVEL_CLIENT_ID!,
    clientSecret: process.env.HIGHLEVEL_CLIENT_SECRET!,
  });
  console.log('HighLevel SDK initialized:', !!highLevel);

  // Try to get token from query param for easy testing
  const tokenParam = searchParams.get('token');
  
  if (!locationId) {
    return NextResponse.json({ error: 'Missing locationId. Provide it as a query param ?locationId=...' }, { status: 400 });
  }

  try {
    if (tokenParam) {
      const limitParam = parseInt(searchParams.get('limit') || '20');
      const type = searchParams.get('type') || 'contacts';
      
      // 1. Get Unified Database Emails if filtering is requested
      const unifiedEmails: Set<string> = new Set();
      const sampleUnified: string[] = [];
      if (filterUnified) {
        // Increase limit to get more users from unified database for better matching
        const unifiedResult = await getUnifiedUserData({ limit: 5000 }); 
        if (unifiedResult.success && unifiedResult.data) {
          unifiedResult.data.forEach((u: any) => {
            if (u.email) {
              const email = u.email.toLowerCase().trim();
              unifiedEmails.add(email);
              if (sampleUnified.length < 5) sampleUnified.push(email);
            }
          });
        }
        console.log(`Unified Database Emails found: ${unifiedEmails.size}`);
      }

      if (type === 'contacts') {
        let allContacts: any[] = [];
        let lastId: string | null = null;
        // If filtering, we might need to scan a lot of GHL contacts to find matches
        let remainingToScan = filterUnified ? 5000 : limitParam; 
        const sampleGhl: string[] = [];

        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        while (remainingToScan > 0) {
          const currentLimit = 100; // Always fetch max for efficiency when scanning
          const fetchUrl: string = `https://services.leadconnectorhq.com/contacts/?locationId=${locationId}&limit=${currentLimit}${lastId ? `&startAfterId=${lastId}` : ''}`;
          
          const response = await fetch(fetchUrl, {
            headers: {
              'Authorization': `Bearer ${tokenParam}`,
              'Version': '2021-07-28',
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          });
          
          const data = await response.json();
          const contacts = data.contacts || [];
          
          if (contacts.length === 0) break;
          
          // Filter contacts if requested
          const filteredBatch = filterUnified 
            ? contacts.filter((c: any) => {
                const email = c.email?.toLowerCase().trim();
                if (email && sampleGhl.length < 5) sampleGhl.push(email);
                return email && unifiedEmails.has(email);
              })
            : contacts;

          allContacts = [...allContacts, ...filteredBatch];
          lastId = contacts[contacts.length - 1].id;
          remainingToScan -= contacts.length;
          
          if (allContacts.length >= limitParam) break;
          if (contacts.length < currentLimit) break;

          // Add a small delay to avoid rate limiting
          await delay(200);
        }

        return NextResponse.json({ 
          success: true, 
          type,
          locationId,
          filterUnified,
          debug: {
            unifiedEmailsCount: unifiedEmails.size,
            totalScannedGhl: filterUnified ? (5000 - remainingToScan) : allContacts.length,
            sampleUnifiedEmails: sampleUnified,
            sampleGhlEmails: sampleGhl
          },
          count: allContacts.length,
          data: { contacts: allContacts.slice(0, limitParam) }
        });
      }
      
      if (type === 'opportunities') {
        // Fetch opportunities
        const oppResponse = await fetch(`https://services.leadconnectorhq.com/opportunities/search?location_id=${locationId}&limit=${limitParam}`, {
          headers: {
            'Authorization': `Bearer ${tokenParam}`,
            'Version': '2021-07-28',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        const oppData = await oppResponse.json();
        const opportunities = oppData.opportunities || [];

        // Fetch users
        const usersResponse = await fetch(`https://services.leadconnectorhq.com/users/?locationId=${locationId}`, {
          headers: {
            'Authorization': `Bearer ${tokenParam}`,
            'Version': '2021-07-28',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        const usersData = await usersResponse.json();
        const users = usersData.users || [];

        // Fetch pipelines
        const pipelinesResponse = await fetch(`https://services.leadconnectorhq.com/opportunities/pipelines/?locationId=${locationId}`, {
          headers: {
            'Authorization': `Bearer ${tokenParam}`,
            'Version': '2021-07-28',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        const pipelinesData = await pipelinesResponse.json();
        const pipelines = pipelinesData.pipelines || [];

        return NextResponse.json({
          success: true,
          type,
          locationId,
          data: { opportunities, users, pipelines }
        });
      } else if (type === 'custom-fields') {
        const response = await fetch(`https://services.leadconnectorhq.com/locations/${locationId}/custom-fields`, {
          headers: {
            'Authorization': `Bearer ${tokenParam}`,
            'Version': '2021-07-28',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        const data = await response.json();
        return NextResponse.json({
          success: true,
          type,
          locationId,
          data
        });
      } else {
        // Default to contacts
        const ghlEndpoint: string = `/contacts/?locationId=${locationId}&limit=${limitParam}`;
        const response = await fetch(`https://services.leadconnectorhq.com${ghlEndpoint}`, {
          headers: {
            'Authorization': `Bearer ${tokenParam}`,
            'Version': '2021-07-28',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        const data = await response.json();
        return NextResponse.json({
          success: true,
          type,
          locationId,
          data
        });
      }
    }
    
    return NextResponse.json({ 
      success: false, 
      message: 'Provide a &token=... in the URL to see real data.'
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      message: 'SDK call failed',
      error: error.message
    }, { status: 500 });
  }
}
