import { prisma } from '@/lib/prisma';
import { COMPANIES } from '@/lib/config';
import { getPayments, getMemberships, getMembers } from '@/lib/whop/fetchers';
import { fetchGhlData } from '@/lib/ghl-client';
import { WhopPayment, WhopMembership, WhopMember } from '@/types';
import { getCashCollectedData } from '@/app/actions';

export async function syncWhop() {
  console.log('Starting Whop synchronization...');

  for (const company of COMPANIES) {
    console.log(`Syncing Whop for company: ${company.name} (${company.id})`);

    // 1. Upsert Company
    await prisma.company.upsert({
      where: { id: company.id },
      update: {
        name: company.name,
        whopCompanyId: company.whopCompanyId,
        whopApiKey: company.whopApiKey,
        ghlLocationId: company.ghlLocationId,
        ghlAccessToken: company.ghlAccessToken,
        googleSheetCashCollectedUrl: company.googleSheetCashCollectedUrl,
        googleSheetPipelineUrl: company.googleSheetPipelineUrl,
      },
      create: {
        id: company.id,
        name: company.name,
        whopCompanyId: company.whopCompanyId,
        whopApiKey: company.whopApiKey,
        ghlLocationId: company.ghlLocationId,
        ghlAccessToken: company.ghlAccessToken,
        googleSheetCashCollectedUrl: company.googleSheetCashCollectedUrl,
        googleSheetPipelineUrl: company.googleSheetPipelineUrl,
      },
    });

    // 2. Fetch Whop Data in parallel
    const [payments, memberships, members] = await Promise.all([
      getPayments(company.whopCompanyId).catch(e => { console.error(`Payments fetch failed for ${company.id}:`, e); return [] as WhopPayment[]; }),
      getMemberships(company.whopCompanyId).catch(e => { console.error(`Memberships fetch failed for ${company.id}:`, e); return [] as WhopMembership[]; }),
      getMembers(company.whopCompanyId).catch(e => { console.error(`Members fetch failed for ${company.id}:`, e); return [] as WhopMember[]; })
    ]);

    console.log(`Fetched ${payments.length} payments, ${memberships.length} memberships, ${members.length} members`);

    // 3. Process Users - Build comprehensive user map with deduplication
    const usersMap = new Map<string, { email: string, name?: string, username?: string, whopId?: string }>();

    // Helper to extract user data from any source
    const extractUserData = (source: any): { email: string, name?: string, username?: string, whopId?: string } | null => {
      const email = source.email || source.user?.email;
      if (!email) return null;
      
      return {
        email: email.toLowerCase().trim(),
        name: source.name || source.user?.name,
        username: source.username || source.user?.username,
        whopId: source.user?.id || source.id
      };
    };

    // Process all sources and merge user data (later sources can override earlier ones for completeness)
    [...members, ...payments, ...memberships].forEach((item: any) => {
      const userData = extractUserData(item);
      if (userData) {
        const existing = usersMap.get(userData.email);
        if (existing) {
          // Merge data - prefer non-undefined values
          usersMap.set(userData.email, {
            email: userData.email,
            name: userData.name || existing.name,
            username: userData.username || existing.username,
            whopId: userData.whopId || existing.whopId
          });
        } else {
          usersMap.set(userData.email, userData);
        }
      }
    });

    console.log(`Found ${usersMap.size} unique users to sync`);

    // 4. Batch fetch existing users to avoid duplicate inserts
    const existingUsers = await prisma.user.findMany({
      where: {
        email: { in: Array.from(usersMap.keys()) },
        companyId: company.id
      },
      select: { email: true, id: true }
    });
    
    const existingUserMap = new Map(existingUsers.map(u => [u.email, u.id]));

    // 5. Create missing users in batch
    const usersToCreate = Array.from(usersMap.entries()).filter(([email]) => !existingUserMap.has(email));
    if (usersToCreate.length > 0) {
      await prisma.user.createMany({
        data: usersToCreate.map(([email, data]) => ({
          email,
          name: data.name,
          username: data.username,
          whopId: data.whopId,
          companyId: company.id,
        })),
        skipDuplicates: true
      });
      console.log(`Created ${usersToCreate.length} new users`);
    }

    // 6. Update existing users
    const usersToUpdate = Array.from(usersMap.entries()).filter(([email]) => existingUserMap.has(email));
    for (const [email, data] of usersToUpdate) {
      await prisma.user.update({
        where: { email_companyId: { email, companyId: company.id } },
        data: {
          name: data.name,
          username: data.username,
          whopId: data.whopId,
        },
      });
    }

    // 7. Fetch all users again to get IDs for payments and memberships
    const allUsers = await prisma.user.findMany({
      where: { companyId: company.id },
      select: { email: true, id: true }
    });
    
    const userIdMap = new Map(allUsers.map(u => [u.email, u.id]));

    // 8. Process Payments - Batch upsert
    const paymentsToProcess = payments.filter(p => {
      const email = p.user?.email?.toLowerCase().trim();
      return email && userIdMap.has(email);
    });

    console.log(`Processing ${paymentsToProcess.length} payments`);

    for (const p of paymentsToProcess) {
      const email = p.user!.email!.toLowerCase().trim();
      const userId = userIdMap.get(email)!;
      
      await prisma.payment.upsert({
        where: { id: p.id },
        update: {
          amount: p.amount_after_fees || p.usd_total || p.total || 0,
          amountBeforeFees: p.usd_total || p.total || 0,
          refundedAmount: p.refunded_amount || 0,
          status: p.status,
          substatus: p.substatus,
          createdAt: new Date(p.created_at),
        },
        create: {
          id: p.id,
          whopId: p.id,
          amount: p.amount_after_fees || p.usd_total || p.total || 0,
          amountBeforeFees: p.usd_total || p.total || 0,
          refundedAmount: p.refunded_amount || 0,
          status: p.status,
          substatus: p.substatus,
          createdAt: new Date(p.created_at),
          userId,
          companyId: company.id,
        },
      });
    }

    // 9. Process Memberships - Batch upsert
    const membershipsToProcess = memberships.filter(m => {
      const email = m.user?.email?.toLowerCase().trim();
      return email && userIdMap.has(email);
    });

    console.log(`Processing ${membershipsToProcess.length} memberships`);

    for (const m of membershipsToProcess) {
      const email = m.user!.email!.toLowerCase().trim();
      const userId = userIdMap.get(email)!;
      
      await prisma.membership.upsert({
        where: { id: m.id },
        update: {
          status: m.status,
          productName: m.product?.title,
          createdAt: new Date(m.created_at),
        },
        create: {
          id: m.id,
          whopId: m.id,
          status: m.status,
          productName: m.product?.title,
          createdAt: new Date(m.created_at),
          userId,
          companyId: company.id,
        },
      });
    }
  }
  console.log('Whop synchronization completed.');
}

export async function syncGhl() {
  console.log('Starting GHL synchronization for existing users...');

  for (const company of COMPANIES) {
    if (company.ghlAccessToken && company.ghlLocationId) {
      try {
        // 1. Sync Pipelines and Stages in parallel
        console.log(`Syncing GHL Pipelines for ${company.name}...`);
        const pipelinesData = await fetchGhlData(`/opportunities/pipelines?locationId=${company.ghlLocationId}`, company.ghlAccessToken);
        const pipelines = pipelinesData.pipelines || [];
        
        // Batch upsert pipelines
        for (const p of pipelines) {
          await prisma.ghlPipeline.upsert({
            where: { ghlId_companyId: { ghlId: p.id, companyId: company.id } },
            update: { name: p.name },
            create: {
              id: p.id,
              ghlId: p.id,
              name: p.name,
              locationId: company.ghlLocationId,
              companyId: company.id
            }
          });
        }

        // Batch upsert stages
        const stagesToUpsert = pipelines.flatMap((p: any) => 
          (p.stages || []).map((s: any) => ({
            where: { id: s.id },
            update: { name: s.name, ghlId: s.id, pipelineId: p.id },
            create: {
              id: s.id,
              ghlId: s.id,
              name: s.name,
              pipelineId: p.id
            }
          }))
        );
        
        for (const stage of stagesToUpsert) {
          await prisma.ghlPipelineStage.upsert(stage);
        }

        // 2. Sync GHL Users (for Assigned To names) - Batch
        console.log(`Syncing GHL Users for ${company.name}...`);
        const ghlUsersData = await fetchGhlData(`/users/?locationId=${company.ghlLocationId}`, company.ghlAccessToken);
        const ghlUsers = ghlUsersData.users || [];
        
        for (const gu of ghlUsers) {
          await prisma.ghlUser.upsert({
            where: { id: gu.id },
            update: { name: gu.name || `${gu.firstName} ${gu.lastName}`, email: gu.email, ghlId: gu.id, companyId: company.id },
            create: {
              id: gu.id,
              ghlId: gu.id,
              name: gu.name || `${gu.firstName} ${gu.lastName}`,
              email: gu.email,
              companyId: company.id
            }
          });
        }

        // 3. Sync Contacts and their Opportunities per user email
        console.log(`Fetching GHL contacts and opportunities for ${company.name}...`);
        
        // Get all users from DB (only those that exist in DB)
        const dbUsers = await prisma.user.findMany({
          where: { companyId: company.id },
          select: { id: true, email: true }
        });

        console.log(`Found ${dbUsers.length} users to sync GHL data for ${company.name}`);

        // Process each user - search contact by email, then fetch their opportunities
        const BATCH_SIZE = 50;
        const allContacts: any[] = [];
        const allOpportunities: any[] = [];
        let contactsNotFound = 0;
        let opportunitiesNotFound = 0;
        
        for (let i = 0; i < dbUsers.length; i += BATCH_SIZE) {
          const batch = dbUsers.slice(i, i + BATCH_SIZE);
          
          // Parallel search for contacts and their opportunities in this batch
          const syncPromises = batch.map(async (user) => {
            try {
              // Step 1: Search contact by email
              const contactResponse = await fetch(`https://services.leadconnectorhq.com/contacts/search`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${company.ghlAccessToken}`,
                  'Version': '2021-07-28',
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  locationId: company.ghlLocationId,
                  pageLimit: 1,
                  filters: [{ field: 'email', operator: 'eq', value: user.email }]
                })
              });

              if (!contactResponse.ok) {
                console.error(`Contact search failed for ${user.email}: ${contactResponse.status}`);
                return null;
              }

              const ghlSearchData = await contactResponse.json();
              const contact = ghlSearchData.contacts?.[0];
              
              if (!contact) {
                contactsNotFound++;
                return null;
              }

              // Add contact with user reference
              allContacts.push({ contact, userId: user.id });

              // Step 2: Fetch opportunities for this contact using contactId filter
              const oppResponse = await fetch(`https://services.leadconnectorhq.com/opportunities/search`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${company.ghlAccessToken}`,
                  'Version': '2021-07-28',
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  locationId: company.ghlLocationId,
                  limit: 100,
                  filters: [{ field: 'contactId', operator: 'eq', value: contact.id }]
                })
              });

              if (oppResponse.ok) {
                const oppData = await oppResponse.json();
                const opportunities = oppData.opportunities || [];
                
                if (opportunities.length === 0) {
                  opportunitiesNotFound++;
                }
                
                for (const opp of opportunities) {
                  // Log opportunity data to debug stageId
                  if (!opp.stageId) {
                    console.log(`Opportunity ${opp.id} has no stageId:`, JSON.stringify(opp));
                  }
                  
                  allOpportunities.push({
                    ...opp,
                    contactEmail: contact.email,
                    contactId: contact.id
                  });
                }
              } else {
                const errorText = await oppResponse.text();
                console.error(`Opportunities fetch failed for ${user.email}: ${oppResponse.status} - ${errorText}`);
              }
              
              return { contact, userId: user.id };
            } catch (err) {
              console.error(`Failed to sync GHL data for ${user.email}:`, err);
              return null;
            }
          });

          await Promise.all(syncPromises);
          
          // Small delay between batches to respect rate limits
          if (i + BATCH_SIZE < dbUsers.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }

        console.log(`=== GHL Sync Summary for ${company.name} ===`);
        console.log(`Total users: ${dbUsers.length}`);
        console.log(`Contacts found: ${allContacts.length}`);
        console.log(`Contacts NOT found: ${contactsNotFound}`);
        console.log(`Opportunities found: ${allOpportunities.length}`);
        console.log(`Users with no opportunities: ${opportunitiesNotFound}`);
        
        // Check for opportunities without stageId
        const opportunitiesWithoutStage = allOpportunities.filter(opp => !opp.stageId);
        console.log(`Opportunities without stageId: ${opportunitiesWithoutStage.length}`);
        
        // Fetch opportunity details for those missing stageId
        if (opportunitiesWithoutStage.length > 0) {
          console.log(`Fetching details for ${opportunitiesWithoutStage.length} opportunities without stageId...`);
          
          const detailPromises = opportunitiesWithoutStage.map(async (opp) => {
            try {
              const detailResponse = await fetchGhlData(`/opportunities/${opp.id}`, company.ghlAccessToken);
              if (detailResponse) {
                return {
                  ...opp,
                  pipelineId: detailResponse.pipelineId || opp.pipelineId,
                  stageId: detailResponse.stageId || opp.stageId
                };
              }
              return opp;
            } catch (err) {
              console.error(`Failed to fetch opportunity details for ${opp.id}:`, err);
              return opp;
            }
          });
          
          const opportunitiesWithDetails = await Promise.all(detailPromises);
          
          // Update allOpportunities with details
          for (let i = 0; i < allOpportunities.length; i++) {
            const oppWithoutStage = opportunitiesWithoutStage.find(o => o.id === allOpportunities[i].id);
            if (oppWithoutStage) {
              const withDetail = opportunitiesWithDetails.find(o => o.id === oppWithoutStage.id);
              if (withDetail) {
                allOpportunities[i] = withDetail;
              }
            }
          }
          
          // Log updated count
          const stillWithoutStage = allOpportunities.filter(opp => !opp.stageId);
          console.log(`Opportunities still without stageId after detail fetch: ${stillWithoutStage.length}`);
        }

        // 4. Batch upsert contacts
        for (const { contact, userId } of allContacts) {
          await prisma.ghlContact.upsert({
            where: { id: contact.id },
            update: {
              email: contact.email.toLowerCase(),
              firstName: contact.firstName,
              lastName: contact.lastName,
              phone: contact.phone,
              tags: contact.tags || [],
              userId,
              createdAt: new Date(contact.dateAdded),
              ghlId: contact.id,
              companyId: company.id
            },
            create: {
              id: contact.id,
              ghlId: contact.id,
              email: contact.email.toLowerCase(),
              firstName: contact.firstName,
              lastName: contact.lastName,
              phone: contact.phone,
              tags: contact.tags || [],
              locationId: company.ghlLocationId,
              userId,
              companyId: company.id,
              createdAt: new Date(contact.dateAdded),
            },
          });
        }

        // 5. Batch upsert opportunities
        for (const opp of allOpportunities) {
          await prisma.ghlOpportunity.upsert({
            where: { ghlId_contactId: { ghlId: opp.id, contactId: opp.contactId } },
            update: {
              name: opp.name,
              status: opp.status,
              monetaryValue: opp.monetaryValue ? parseFloat(opp.monetaryValue) : null,
              pipelineId: opp.pipelineId,
              stageId: opp.stageId,
              companyId: company.id
            },
            create: {
              id: opp.id,
              ghlId: opp.id,
              name: opp.name,
              status: opp.status,
              monetaryValue: opp.monetaryValue ? parseFloat(opp.monetaryValue) : null,
              pipelineId: opp.pipelineId,
              stageId: opp.stageId,
              contactId: opp.contactId,
              companyId: company.id
            }
          });
        }

        console.log(`Synced ${allOpportunities.length} opportunities for ${company.name}`);

        // 6. Fetch appointments for found contacts in parallel
        const contactIds = allContacts.map(({ contact }) => contact.id);
        
        console.log(`Fetching appointments for ${contactIds.length} contacts...`);

        // Fetch appointments in parallel
        const apptPromises = contactIds.map(async (contactId) => {
          try {
            const apptData = await fetchGhlData(`/contacts/${contactId}/appointments`, company.ghlAccessToken);
            return { contactId, appointments: Array.isArray(apptData.events) ? apptData.events : [] };
          } catch (err) {
            console.error(`Failed to fetch appointments for contact ${contactId}:`, err);
            return { contactId, appointments: [] };
          }
        });

        const apptResults = await Promise.all(apptPromises);

        // 7. Batch upsert appointments
        const allAppointments: any[] = apptResults.flatMap((r: any) =>
          r.appointments.map((appt: any) => ({ ...appt, contactId: r.contactId }))
        );

        for (const appt of allAppointments) {
          await prisma.ghlAppointment.upsert({
            where: { id: appt.id },
            update: {
              title: appt.title,
              status: appt.appointmentStatus,
              startTime: new Date(appt.startTime),
              endTime: appt.endTime ? new Date(appt.endTime) : null,
              assignedTo: appt.assignedUserId,
              createdAt: new Date(appt.dateAdded || Date.now()),
              ghlId: appt.id,
              contactId: appt.contactId
            },
            create: {
              id: appt.id,
              ghlId: appt.id,
              title: appt.title,
              status: appt.appointmentStatus,
              startTime: new Date(appt.startTime),
              endTime: appt.endTime ? new Date(appt.endTime) : null,
              assignedTo: appt.assignedUserId,
              createdAt: new Date(appt.dateAdded || Date.now()),
              contactId: appt.contactId
            }
          });
        }

      } catch (error) {
        console.error(`GHL sync failed for ${company.id}:`, error);
      }
    }
  }
  console.log('GHL synchronization completed.');
}

export async function syncGoogleSheets() {
  console.log('Starting Google Sheets synchronization...');

  for (const company of COMPANIES) {
    if (company.googleSheetCashCollectedUrl) {
      try {
        console.log(`Syncing Google Sheet data for ${company.name}...`);
        const sheetResult = await getCashCollectedData(company.googleSheetCashCollectedUrl);
        if (sheetResult.success && sheetResult.data) {
          // Process all rows and collect data
          const rowsToProcess = sheetResult.data.map(row => {
            const email = (row.contactEmail || row.altEmail || '').toLowerCase().trim();
            if (!email) return null;

            const amount = parseFloat(row.amount?.toString().replace(/[^0-9.-]+/g, '')) || 0;
            let rowDate = new Date();
            if (row.date) {
              const serial = parseFloat(row.date);
              if (!isNaN(serial) && serial > 30000 && serial < 60000) {
                rowDate = new Date((serial - 25569) * 86400 * 1000);
              } else {
                const parsedDate = new Date(row.date);
                rowDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
              }
            }

            return {
              email,
              contactName: row.contactName || row.bookingName || 'Unknown',
              amount,
              date: rowDate,
              type: row.type,
              altEmail: row.altEmail,
              portal: row.portal,
              platform: row.platform,
              recurring: row.recurring,
              closer: row.closer,
              notes: row.notes,
              leadFi: row.leadFi,
              bookingName: row.bookingName,
              setter: row.setter,
              manualCloser: row.manualCloser,
              csm: row.csm,
            };
          }).filter((r): r is NonNullable<typeof r> => r !== null);

          // Batch fetch existing users
          const emails = rowsToProcess.map(r => r.email);
          const existingUsers = await prisma.user.findMany({
            where: {
              email: { in: emails },
              companyId: company.id
            },
            select: { email: true, id: true }
          });
          
          const userIdMap = new Map(existingUsers.map(u => [u.email, u.id]));

          // Create missing users in batch
          const usersToCreate = rowsToProcess.filter(r => !userIdMap.has(r.email));
          if (usersToCreate.length > 0) {
            await prisma.user.createMany({
              data: usersToCreate.map(r => ({
                email: r.email,
                name: r.contactName,
                companyId: company.id,
              })),
              skipDuplicates: true
            });
          }

          // Fetch all users again to get IDs
          const allUsers = await prisma.user.findMany({
            where: { companyId: company.id },
            select: { email: true, id: true }
          });
          
          const updatedUserIdMap = new Map(allUsers.map(u => [u.email, u.id]));

          // Prepare sheet data for bulk insert
          const sheetDataToCreate = rowsToProcess.map(row => ({
            date: row.date,
            type: row.type,
            contactName: row.contactName,
            contactEmail: row.email,
            altEmail: row.altEmail,
            amount: row.amount,
            portal: row.portal,
            platform: row.platform,
            recurring: row.recurring,
            closer: row.closer,
            notes: row.notes,
            leadFi: row.leadFi,
            bookingName: row.bookingName,
            setter: row.setter,
            manualCloser: row.manualCloser,
            csm: row.csm,
            userId: updatedUserIdMap.get(row.email),
            companyId: company.id
          }));

          // Delete old data and insert new data
          await prisma.sheetData.deleteMany({ where: { companyId: company.id } });
          
          // Insert in batches of 100
          const BATCH_SIZE = 100;
          for (let i = 0; i < sheetDataToCreate.length; i += BATCH_SIZE) {
            const batch = sheetDataToCreate.slice(i, i + BATCH_SIZE);
            await prisma.sheetData.createMany({ data: batch });
          }

          console.log(`Synced ${sheetDataToCreate.length} sheet data records for ${company.name}`);
        }
      } catch (error) {
        console.error(`Sheet sync failed for ${company.id}:`, error);
      }
    }
  }
  console.log('Google Sheets synchronization completed.');
}

export async function syncData() {
  await syncWhop();
  await syncGhl();
  await syncGoogleSheets();
}
