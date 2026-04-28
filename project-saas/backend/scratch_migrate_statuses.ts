import { PrismaClient } from './src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('Updating order statuses to safe values...');
  
  // Update ACCEPTED and READY to VALIDATED (or PENDING if VALIDATED doesn't exist yet)
  // Actually, we can't update to VALIDATED yet because it's not in the DB enum.
  // We should update everything to PENDING.
  
  const result = await prisma.$executeRawUnsafe(
    `UPDATE "Order" SET "status" = 'PENDING' WHERE "status" IN ('ACCEPTED', 'READY', 'CANCELLED')`
  );
  
  console.log(`Updated ${result} orders to PENDING.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
