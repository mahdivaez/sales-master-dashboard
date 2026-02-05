'use server';

import { prisma } from '@/lib/prisma';
import { COMPANIES } from '@/lib/config';
import { google } from 'googleapis';
import { cache } from 'react';

// Helper function to convert string to camelCase
function toCamelCase(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase());
}

export const getCashCollectedData = cache(async (spreadsheetUrl?: string) => {
  const defaultUrl = 'https://docs.google.com/spreadsheets/d/1dKazylux_iM4LGo_1fj5hJiACZLb_fKsfFiSNdjYgx4/edit?gid=1877425889#gid=1877425889';
  const url = spreadsheetUrl || defaultUrl;

  try {
    let auth;
    if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
    } else {
      return { success: false, error: 'Google credentials not found' };
    }

    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!match) throw new Error('Invalid Google Sheet URL');
    const spreadsheetId = match[1];

    const sheets = google.sheets({ version: 'v4', auth });
    const range = 'Cash Collected!A:Z';
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) throw new Error('No data found in the sheet');

    const rawHeaders = rows[0].map((h: string) => h.trim());
    const requiredColumns = [
      'Date', 'Type', 'Contact Name', 'Contact Email', 'Alt Email',
      'Amount', 'Portal', 'Platform', 'Recurring', 'Closer',
      'Notes', 'Unique', 'AVG', 'LeadFi', 'Booking Name',
      'Setter', 'Manual Closer', 'CSM'
    ];

    const headerIndices = requiredColumns.map(col => ({
      name: col,
      index: rawHeaders.lastIndexOf(col)
    }));

    const data = rows.slice(1).map((row: any[]) => {
      const obj: any = {};
      headerIndices.forEach(({ name, index }) => {
        obj[toCamelCase(name)] = index !== -1 ? row[index] || '' : '';
      });
      return obj;
    });

    return { success: true, data };
  } catch (error: any) {
    console.error('Error reading Google Sheet:', error);
    return { success: false, error: error.message };
  }
});

export async function getUnifiedUserData(options: {
  limit?: number;
  offset?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  companyId?: string;
  electiveData?: any[];
} = {}) {
  const { limit = 50, offset = 0, search = '', startDate, endDate, companyId } = options;

  try {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const where: any = {};
    if (companyId && companyId !== 'all') {
      where.companyId = companyId;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch users from DB
    const dbUsers = await prisma.user.findMany({
      where,
      include: {
        payments: {
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        memberships: {
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        sheetData: {
          where: {
            date: {
              gte: start,
              lte: end,
            },
          },
          orderBy: {
            date: 'desc'
          }
        },
        electiveData: {
          where: {
            saleDate: {
              gte: start,
              lte: end,
            },
          },
          orderBy: {
            saleDate: 'desc'
          }
        },
        ghlContact: {
          include: {
            opportunities: true,
            appointments: true
          }
        },
        company: {
          include: {
            ghlPipelines: {
              include: {
                stages: true
              }
            },
            ghlUsers: true
          }
        },
      },
    });

    const formattedData = dbUsers.map(u => {
      const totalSpentWhop = u.payments.reduce((sum, p) => {
        if (p.status === 'paid' || p.substatus === 'succeeded' || p.substatus === 'resolution_won') {
          return sum + (p.amount - p.refundedAmount);
        }
        return sum;
      }, 0);

      const totalSpentWhopBeforeFees = u.payments.reduce((sum, p) => {
        if (p.status === 'paid' || p.substatus === 'succeeded' || p.substatus === 'resolution_won') {
          return sum + (p.amountBeforeFees - p.refundedAmount);
        }
        return sum;
      }, 0);

      const totalSpentSheet = u.sheetData.reduce((sum, s) => sum + s.amount, 0);
      const totalSpentElective = u.electiveData.reduce((sum, e) => sum + e.netAmount, 0);

      const lastPaymentDate = Math.max(
        u.payments.length > 0 ? u.payments[0].createdAt.getTime() : 0,
        u.sheetData.length > 0 ? u.sheetData[0].date.getTime() : 0,
        u.electiveData.length > 0 ? u.electiveData[0].saleDate.getTime() : 0
      );

      // Helper to resolve GHL names
      const pipelines = u.company.ghlPipelines;
      const ghlUsers = u.company.ghlUsers;

      const resolveStageName = (pId: string | null, sId: string | null) => {
        if (!pId || !sId) return '-';
        const pipeline = pipelines.find(p => p.ghlId === pId);
        const stage = pipeline?.stages.find(s => s.ghlId === sId);
        return stage?.name || sId;
      };

      const resolvePipelineName = (pId: string | null) => {
        if (!pId) return '-';
        const pipeline = pipelines.find(p => p.ghlId === pId);
        return pipeline?.name || pId;
      };

      const resolveUserName = (guId: string | null) => {
        if (!guId) return 'Unassigned';
        const gUser = ghlUsers.find(gu => gu.ghlId === guId);
        return gUser?.name || guId;
      };

      return {
        email: u.email,
        name: u.name,
        username: u.username || '',
        whopId: u.whopId || '',
        whopData: {
          member: null,
          payments: u.payments.map(p => ({
            id: p.id,
            status: p.status,
            substatus: p.substatus,
            amount_after_fees: p.amount,
            usd_total: p.amountBeforeFees,
            refunded_amount: p.refundedAmount,
            created_at: p.createdAt.toISOString(),
          })),
          memberships: u.memberships.map(m => ({
            id: m.id,
            status: m.status,
            created_at: m.createdAt.toISOString(),
            product: { title: m.productName }
          })),
        },
        ghlData: u.ghlContact ? {
          contact: {
            id: u.ghlContact.ghlId,
            firstName: u.ghlContact.firstName,
            lastName: u.ghlContact.lastName,
            email: u.ghlContact.email,
            phone: u.ghlContact.phone,
            tags: u.ghlContact.tags,
            dateAdded: u.ghlContact.createdAt.toISOString()
          },
          opportunities: u.ghlContact.opportunities.map(o => ({
            id: o.ghlId,
            name: o.name,
            monetaryValue: o.monetaryValue,
            status: o.status,
            pipelineId: o.pipelineId,
            pipelineStageId: o.pipelineStageId,
            assignedTo: o.assignedTo,
            createdAt: o.createdAt.toISOString(),
            pipelineName: resolvePipelineName(o.pipelineId),
            stageName: resolveStageName(o.pipelineId, o.pipelineStageId),
            assignedToName: resolveUserName(o.assignedTo)
          })),
          appointments: u.ghlContact.appointments.map(a => ({
            id: a.ghlId,
            title: a.title,
            appointmentStatus: a.status,
            startTime: a.startTime.toISOString(),
            assignedUserId: a.assignedTo,
            assignedToName: resolveUserName(a.assignedTo)
          })),
          ghlUsers: ghlUsers,
          pipelines: pipelines
        } : null,
        ghlStageName: u.ghlContact?.opportunities[0] ? resolveStageName(u.ghlContact.opportunities[0].pipelineId, u.ghlContact.opportunities[0].pipelineStageId) : '-',
        ghlPipelineName: u.ghlContact?.opportunities[0] ? resolvePipelineName(u.ghlContact.opportunities[0].pipelineId) : '-',
        ghlAssignedToName: u.ghlContact?.opportunities[0] ? resolveUserName(u.ghlContact.opportunities[0].assignedTo) : (u.ghlContact ? resolveUserName(u.ghlContact.userId) : 'Unassigned'),
        
        sheetData: u.sheetData.map(s => ({
          date: s.date.toISOString(),
          amount: s.amount.toString(),
          contactName: s.contactName,
          contactEmail: s.contactEmail,
          type: s.type,
          portal: s.portal,
          platform: s.platform,
          closer: s.closer,
          setter: s.setter,
        })),
        electiveData: u.electiveData.map(e => ({
          saleDate: e.saleDate.toISOString(),
          customerName: e.customerName,
          customerEmail: e.customerEmail,
          netAmount: e.netAmount,
        })),
        pipelineData: [],
        totalSpentWhop,
        totalSpentWhopBeforeFees,
        totalSpentSheet,
        totalSpentElective,
        lastPaymentDate,
        source: ['Database'],
        companies: [u.company.name]
      };
    });

    formattedData.sort((a, b) => (b.lastPaymentDate || 0) - (a.lastPaymentDate || 0));

    const totalCountResult = formattedData.length;
    const paginatedData = formattedData.slice(offset, offset + limit);

    return {
      success: true,
      data: paginatedData,
      totalCount: totalCountResult,
      hasMore: offset + limit < totalCountResult
    };
  } catch (error: any) {
    console.error('Error in getUnifiedUserData from DB:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function getGhlContactByEmail(email: string) {
  try {
    const contact = await prisma.ghlContact.findFirst({
      where: { email },
      include: {
        opportunities: true,
        appointments: true
      }
    });

    if (!contact) {
      return { success: true, contact: null };
    }

    return {
      success: true,
      contact: {
        id: contact.ghlId,
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        tags: contact.tags,
        dateAdded: contact.createdAt.toISOString(),
        opportunities: contact.opportunities,
        appointments: contact.appointments
      }
    };
  } catch (error: any) {
    console.error('Error fetching GHL contact by email:', error);
    return { success: false, error: error.message };
  }
}
