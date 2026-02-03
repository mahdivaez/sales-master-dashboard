# Database Architecture & Synchronization Plan (Supabase/Prisma)

## 1. Database Solution Recommendation
**Recommendation: Supabase (PostgreSQL)**

- **Why Supabase?** Managed PostgreSQL, built-in auth, and excellent performance for concurrent writes during sync.
- **ORM:** **Prisma** for type-safe database access and migrations.

## 2. Technical Schema (Prisma)

```prisma
// schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id            String         @id @default(uuid())
  email         String         @unique
  name          String?
  username      String?
  whopData      WhopData[]
  ghlData       GhlData[]
  sheetData     SheetData[]
  electiveData  ElectiveData[]
  syncLogs      SyncLog[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

model WhopData {
  id              String   @id @default(uuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  externalWhopId  String   @unique
  rawData         Json     // Stores full Whop API response
  lastSynced      DateTime @default(now())
  deletedAt       DateTime?
}

model GhlData {
  id                String   @id @default(uuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id])
  externalContactId String   @unique
  locationId        String
  rawData           Json     // Stores full GHL API response
  lastSynced        DateTime @default(now())
  deletedAt         DateTime?
}

model SheetData {
  id         String   @id @default(uuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  sourceUrl  String
  rowHash    String   @unique // SHA-256 of row content
  data       Json
  date       DateTime
  lastSynced DateTime @default(now())
}

model ElectiveData {
  id         String   @id @default(uuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  rowHash    String   @unique
  data       Json
  amount     Float
  date       DateTime
  lastSynced DateTime @default(now())
}

model SyncLog {
  id                String   @id @default(uuid())
  userId            String?
  user              User?    @relation(fields: [userId], references: [id])
  source            String   // "WHOP", "GHL", "SHEET", "ELECTIVE"
  status            String   // "SUCCESS", "FAILED", "PARTIAL"
  recordsProcessed  Int      @default(0)
  errorMessage      String?
  startedAt         DateTime @default(now())
  completedAt       DateTime?
}
```

## 3. Data Synchronization Scenarios & Technical Handling

| Scenario | Technical Handling |
| :--- | :--- |
| **New User Discovery** | `prisma.user.upsert` using `email`. If new, create `User` record first. |
| **Multi-Source Linking** | All source tables (`WhopData`, `GhlData`) use `userId` (FK) pointing to the same `User` record resolved by email. |
| **Duplicate Prevention** | Database-level `@unique` constraints on `externalId` and `rowHash` trigger "On Conflict Update" (UPSERT). |
| **Data Drift (Updates)** | `UPSERT` updates the `rawData` JSONB field, preserving the latest state from the source. |
| **Soft Deletes** | Records missing from a full sync are marked with `deletedAt = now()` instead of being removed. |
| **Financial Aggregation** | A database view or computed field sums `amount` from `WhopData.rawData->>'usd_total'` and `SheetData.data->>'amount'`. |
| **Conflict Resolution** | **Name:** Priority logic in the Repository layer: `GHL.name ?? Whop.name ?? Sheet.name`. |

## 4. Intelligent Sync Engine (Implementation Logic)

```typescript
// lib/services/sync-engine.ts

export async function syncSourceData(sourceType: string, records: any[]) {
  const results = { created: 0, updated: 0, failed: 0 };

  for (const record of records) {
    try {
      const email = record.email.toLowerCase().trim();
      
      await prisma.$transaction(async (tx) => {
        // 1. Resolve User
        const user = await tx.user.upsert({
          where: { email },
          update: { /* update name if priority allows */ },
          create: { email, name: record.name }
        });

        // 2. Resolve Source Record
        if (sourceType === 'WHOP') {
          await tx.whopData.upsert({
            where: { externalWhopId: record.id },
            update: { rawData: record, lastSynced: new Date(), deletedAt: null },
            create: { userId: user.id, externalWhopId: record.id, rawData: record }
          });
        }
        // ... repeat for GHL, Sheet, etc.
      });
      results.updated++;
    } catch (e) {
      results.failed++;
      console.error(`Sync failed for record: ${record.id}`, e);
    }
  }
  return results;
}
```

## 5. Error Handling & Recovery
- **Transactions:** Every user sync is wrapped in a `prisma.$transaction`.
- **Logging:** Every sync session creates a `SyncLog` entry for auditing.
- **Validation:** Zod schemas validate incoming API data before DB insertion.

---
**This document is now ready to serve as the technical specification for implementation.**
