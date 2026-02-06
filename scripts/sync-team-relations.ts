import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncRelations() {
  console.log('Starting sync of Closer/Setter relations...');

  // 1. Get all sheet data with closer/setter names
  const sheetData = await prisma.sheetData.findMany({
    where: {
      OR: [
        { closer: { not: null } },
        { setter: { not: null } }
      ]
    }
  });

  console.log(`Found ${sheetData.length} sheet data records to process.`);

  for (const row of sheetData) {
    const updateData: any = {};

    if (row.closer) {
      const closer = await prisma.closer.upsert({
        where: {
          name_companyId: {
            name: row.closer,
            companyId: row.companyId
          }
        },
        update: {},
        create: {
          name: row.closer,
          companyId: row.companyId
        }
      });
      updateData.closerId = closer.id;
    }

    if (row.setter) {
      const setter = await prisma.setter.upsert({
        where: {
          name_companyId: {
            name: row.setter,
            companyId: row.companyId
          }
        },
        update: {},
        create: {
          name: row.setter,
          companyId: row.companyId
        }
      });
      updateData.setterId = setter.id;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.sheetData.update({
        where: { id: row.id },
        data: updateData
      });
    }
  }

  console.log('Sync completed successfully.');
}

syncRelations()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
