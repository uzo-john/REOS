/**
 * Run with: node set-admin.js <your-email>
 * e.g:  node set-admin.js john@example.com
 *
 * Or without an argument to promote ALL users to SUPER_ADMIN (dev only).
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];

  if (!email) {
    // list all users to help pick one
    const users = await prisma.user.findMany({
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });
    console.log('\n=== All Users in Database ===');
    users.forEach((u) => {
      console.log(`  ${u.email}  |  ${u.firstName} ${u.lastName}  |  role: ${u.role}  |  id: ${u.id}`);
    });
    console.log('\nRun: node set-admin.js <email> to promote that user to SUPER_ADMIN');
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`❌  No user found with email: ${email}`);
    return;
  }

  const updated = await prisma.user.update({
    where: { email },
    data: { role: 'SUPER_ADMIN' },
    select: { id: true, email: true, firstName: true, lastName: true, role: true },
  });

  console.log(`\n✅ User promoted to SUPER_ADMIN:`);
  console.log(`   Name:  ${updated.firstName} ${updated.lastName}`);
  console.log(`   Email: ${updated.email}`);
  console.log(`   Role:  ${updated.role}`);
  console.log(`   ID:    ${updated.id}`);
  console.log('\nLog out and log back in to get a new JWT with the updated role.\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
