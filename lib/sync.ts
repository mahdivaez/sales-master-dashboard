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

    // 2. Fetch Whop Data
    const [payments, memberships, members] = await Promise.all([
      getPayments(company.whopCompanyId).catch(e => { console.error(`Payments fetch failed for ${company.id}:`, e); return [] as WhopPayment[]; }),
      getMemberships(company.whopCompanyId).catch(e => { console.error(`Memberships fetch failed for ${company.id}:`, e); return [] as WhopMembership[]; }),
      getMembers(company.whopCompanyId).catch(e => { console.error(`Members fetch failed for ${company.id}:`, e); return [] as WhopMember[]; })
    ]);

    // 3. Process Users
    const usersMap = new Map<string, { email: string, name?: string, username?: string, whopId?: string }>();

    members.forEach((m: any) => {
      const email = m.email || m.user?.email;
      if (email) {
        usersMap.set(email.toLowerCase(), {
          email: email.toLowerCase(),
          name: m.name || m.user?.name,
          username: m.username || m.user?.username,
          whopId: m.user?.id
        });
      }
    });

    payments.forEach(p => {
      const email = p.user?.email;
      if (email && !usersMap.has(email.toLowerCase())) {
        usersMap.set(email.toLowerCase(), {
          email: email.toLowerCase(),
          name: p.user?.name,
          username: p.user?.username,
          whopId: p.user?.id
        });
      }
    });

    memberships.forEach((m: any) => {
      const email = m.user?.email;
      if (email && !usersMap.has(email.toLowerCase())) {
        usersMap.set(email.toLowerCase(), {
          email: email.toLowerCase(),
          name: m.user?.name,
          username: m.user?.username,
          whopId: m.user?.id
        });
      }
    });

    for (const userData of usersMap.values()) {
      await prisma.user.upsert({
        where: { email_companyId: { email: userData.email, companyId: company.id } },
        update: {
          name: userData.name,
          username: userData.username,
          whopId: userData.whopId,
        },
        create: {
          email: userData.email,
          name: userData.name,
          username: userData.username,
          whopId: userData.whopId,
          companyId: company.id,
        },
      });
    }

    // 4. Process Payments
    for (const p of payments) {
      const email = p.user?.email;
      if (!email) continue;
      const user = await prisma.user.findUnique({ where: { email_companyId: { email: email.toLowerCase(), companyId: company.id } } });
      if (user) {
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
            userId: user.id,
            companyId: company.id,
          },
        });
      }
    }

    // 5. Process Memberships
    for (const m of memberships) {
      const email = m.user?.email;
      if (!email) continue;
      const user = await prisma.user.findUnique({ where: { email_companyId: { email: email.toLowerCase(), companyId: company.id } } });
      if (user) {
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
            userId: user.id,
            companyId: company.id,
          },
        });
      }
    }
  }
  console.log('Whop synchronization completed.');
}

export async function syncGhl() {
  console.log('Starting GHL synchronization for existing users...');

  for (const company of COMPANIES) {
    if (company.ghlAccessToken && company.ghlLocationId) {
      try {
        // 1. Sync Pipelines and Stages
        console.log(`Syncing GHL Pipelines for ${company.name}...`);
        const pipelinesData = await fetchGhlData(`/opportunities/pipelines?locationId=${company.ghlLocationId}`, company.ghlAccessToken);
        const pipelines = pipelinesData.pipelines || [];
        
        for (const p of pipelines) {
          const dbPipeline = await prisma.ghlPipeline.upsert({
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

          for (const s of (p.stages || [])) {
            await prisma.ghlPipelineStage.upsert({
              where: { id: s.id },
              update: { name: s.name, ghlId: s.id, pipelineId: dbPipeline.id },
              create: {
                id: s.id,
                ghlId: s.id,
                name: s.name,
                pipelineId: dbPipeline.id
              }
            });
          }
        }

        // 2. Sync GHL Users (for Assigned To names)
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

        // 3. Sync Contacts, Opps, and Appts
        const users = await prisma.user.findMany({
          where: { companyId: company.id }
        });

        console.log(`Syncing GHL data for ${users.length} users in ${company.name}...`);

        for (const user of users) {
          try {
            const response = await fetch(`https://services.leadconnectorhq.com/contacts/search`, {
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

            if (!response.ok) continue;

            const ghlSearchData = await response.json();
            const contact = ghlSearchData.contacts?.[0];
            
            if (contact) {
              const dbContact = await prisma.ghlContact.upsert({
                where: { id: contact.id },
                update: {
                  email: contact.email.toLowerCase(),
                  firstName: contact.firstName,
                  lastName: contact.lastName,
                  phone: contact.phone,
                  tags: contact.tags || [],
                  userId: user.id,
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
                  userId: user.id,
                  companyId: company.id,
                  createdAt: new Date(contact.dateAdded),
                },
              });

              // Fetch Opportunities
              const oppData = await fetchGhlData(`/opportunities/search?location_id=${company.ghlLocationId}&contact_id=${contact.id}`, company.ghlAccessToken);
              const opportunities = Array.isArray(oppData.opportunities) ? oppData.opportunities : [];
              
              for (const opp of opportunities) {
                await prisma.ghlOpportunity.upsert({
                  where: { id: opp.id },
                  update: {
                    name: opp.name,
                    monetaryValue: parseFloat(opp.monetaryValue) || 0,
                    status: opp.status,
                    pipelineId: opp.pipelineId,
                    pipelineStageId: opp.pipelineStageId,
                    assignedTo: opp.assignedTo,
                    createdAt: new Date(opp.createdAt),
                    ghlId: opp.id,
                    contactId: dbContact.id
                  },
                  create: {
                    id: opp.id,
                    ghlId: opp.id,
                    name: opp.name,
                    monetaryValue: parseFloat(opp.monetaryValue) || 0,
                    status: opp.status,
                    pipelineId: opp.pipelineId,
                    pipelineStageId: opp.pipelineStageId,
                    assignedTo: opp.assignedTo,
                    createdAt: new Date(opp.createdAt),
                    contactId: dbContact.id
                  }
                });
              }

              // Fetch Appointments
              const apptData = await fetchGhlData(`/contacts/${contact.id}/appointments`, company.ghlAccessToken);
              const appointments = Array.isArray(apptData.events) ? apptData.events : [];
              
              for (const appt of appointments) {
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
                    contactId: dbContact.id
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
                    contactId: dbContact.id
                  }
                });
              }
            }
          } catch (userErr) {
            console.error(`Failed to sync GHL data for user ${user.email}:`, userErr);
          }
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
          await prisma.sheetData.deleteMany({ where: { companyId: company.id } });

          for (const row of sheetResult.data) {
            const email = (row.contactEmail || row.altEmail || '').toLowerCase().trim();
            if (!email) continue;

            let user = await prisma.user.findUnique({ where: { email_companyId: { email, companyId: company.id } } });
            if (!user) {
              user = await prisma.user.create({
                data: { email, name: row.contactName || row.bookingName || 'Unknown', companyId: company.id }
              });
            }

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

            await prisma.sheetData.create({
              data: {
                date: rowDate,
                type: row.type,
                contactName: row.contactName,
                contactEmail: email,
                altEmail: row.altEmail,
                amount: amount,
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
                userId: user.id,
                companyId: company.id
              }
            });
          }
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
