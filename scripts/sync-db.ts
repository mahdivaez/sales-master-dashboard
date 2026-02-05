import { syncData } from '../lib/sync';

async function main() {
  try {
    await syncData();
    process.exit(0);
  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  }
}

main();
