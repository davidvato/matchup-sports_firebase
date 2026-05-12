const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Applying manual migration...');
  try {
    await prisma.$transaction([
      prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "_GroupPairs" (
            "A" TEXT NOT NULL,
            "B" TEXT NOT NULL
        );
      `),
      prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "_GroupPairs_AB_unique" ON "_GroupPairs"("A", "B");
      `),
      prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "_GroupPairs_B_index" ON "_GroupPairs"("B");
      `),
      prisma.$executeRawUnsafe(`
        ALTER TABLE "_GroupPairs" DROP CONSTRAINT IF EXISTS "_GroupPairs_A_fkey";
      `),
      prisma.$executeRawUnsafe(`
        ALTER TABLE "_GroupPairs" DROP CONSTRAINT IF EXISTS "_GroupPairs_B_fkey";
      `),
      prisma.$executeRawUnsafe(`
        ALTER TABLE "_GroupPairs" ADD CONSTRAINT "_GroupPairs_A_fkey" FOREIGN KEY ("A") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `),
      prisma.$executeRawUnsafe(`
        ALTER TABLE "_GroupPairs" ADD CONSTRAINT "_GroupPairs_B_fkey" FOREIGN KEY ("B") REFERENCES "Pair"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      `),
      prisma.$executeRawUnsafe(`
        INSERT INTO "_GroupPairs" ("A", "B")
        SELECT "groupId", "id" FROM "Pair" 
        WHERE "groupId" IS NOT NULL
        ON CONFLICT ("A", "B") DO NOTHING;
      `),
      // Optionally drop the old column, but maybe keep it for safety during transition
      // prisma.$executeRawUnsafe(`ALTER TABLE "Pair" DROP COLUMN IF EXISTS "groupId";`)
    ]);
    console.log('Migration applied successfully!');
  } catch (error) {
    console.error('Error applying migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
