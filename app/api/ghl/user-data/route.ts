import { NextRequest, NextResponse } from 'next/server';
import { searchContactByEmail, fetchGhlData } from '@/lib/ghl-client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get('email');
  const locationIdParam = searchParams.get('locationId');
  const authHeader = request.headers.get('Authorization');
  const accessTokenParam = authHeader?.split(' ')[1];

  // Fallback to environment variables if not provided in request
  const locationId = locationIdParam || process.env.LOCATION_ID || '';
  const accessToken = accessTokenParam || process.env.GHL_ACCESS_TOKEN || '';

  if (!email || !locationId || !accessToken) {
    console.error('Missing GHL parameters:', { email: !!email, locationId: !!locationId, accessToken: !!accessToken });
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    console.log(`Fetching GHL data for email: ${email}, locationId: ${locationId}`);
    // 1. Search for contact
    const contact = await searchContactByEmail(email, locationId, accessToken);
    console.log('GHL Contact found:', contact ? contact.id : 'None');
    
    if (!contact) {
      return NextResponse.json({ contact: null, opportunities: [] });
    }

    // 2. Fetch opportunities for this contact
    let opportunities = [];
    try {
      const oppData = await fetchGhlData(`/opportunities/search?location_id=${locationId}&contact_id=${contact.id}`, accessToken);
      opportunities = oppData.opportunities || [];
      console.log(`GHL Opportunities found: ${opportunities.length}`);
    } catch (err) {
      console.error('Error fetching GHL opportunities:', err);
    }

    // 2.5 Fetch appointments for this contact
    let appointments = [];
    try {
      const apptData = await fetchGhlData(`/contacts/${contact.id}/appointments`, accessToken);
      appointments = apptData.events || [];
      console.log(`GHL Appointments found: ${appointments.length}`);
    } catch (err) {
      console.error('Error fetching GHL appointments:', err);
    }
    
    // 3. Fetch pipelines to get stage names
    let pipelines = [];
    try {
      const pipelinesData = await fetchGhlData(`/opportunities/pipelines?locationId=${locationId}`, accessToken);
      pipelines = pipelinesData.pipelines || [];
    } catch (err) {
      console.error('Error fetching GHL pipelines:', err);
    }

    // 4. Fetch custom fields schema
    let customFields = [];
    try {
      const cfData = await fetchGhlData(`/locations/${locationId}/custom-fields`, accessToken);
      customFields = cfData.customFields || [];
    } catch (err) {
      console.error('Error fetching GHL custom fields:', err);
    }

    // 5. Fetch users for assignment mapping
    let ghlUsers = [];
    try {
      // Note: The /users/ endpoint might require a different version or scope
      const usersData = await fetchGhlData(`/users/?locationId=${locationId}`, accessToken);
      ghlUsers = usersData.users || [];
    } catch (err) {
      console.error('Error fetching GHL users:', err);
    }
    
    const responseData = {
      contact,
      opportunities,
      appointments,
      pipelines,
      customFieldsSchema: customFields,
      ghlUsers
    };

    console.log('GHL Full Data Response:', JSON.stringify(responseData, null, 2));

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('GHL User Data Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
