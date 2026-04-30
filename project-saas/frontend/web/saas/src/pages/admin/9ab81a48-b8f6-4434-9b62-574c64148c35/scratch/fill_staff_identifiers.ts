import prisma from "../../../../../../../../backend/src/lib/prisma"

async function main() {
  const staff = await prisma.staff.findMany({
    where: {
      identifier: null
    }
  });

  console.log(`Found ${staff.length} staff without identifier.`);

  for (const s of staff) {
    const identifier = `STAFF_${s.name.replace(/\s+/g, '_').toUpperCase()}_${Math.floor(Math.random() * 1000)}`;
    await prisma.staff.update({
      where: { id: s.id },
      data: { identifier }
    });
    console.log(`Updated staff ${s.name} with identifier ${identifier}`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
