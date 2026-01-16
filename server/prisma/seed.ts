import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme';
  const adminName = process.env.ADMIN_NAME || 'Administrator';

  // Check if admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (existingAdmin) {
    console.log('Admin user already exists, skipping seed.');
    return;
  }

  // Create admin user
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      name: adminName,
      role: 'ADMIN',
      approved: true,
    },
  });

  console.log(`
╔═══════════════════════════════════════════════╗
║         Admin User Created                     ║
╠═══════════════════════════════════════════════╣
║  Email: ${adminEmail.padEnd(35)}║
║  Password: ${adminPassword.padEnd(33)}║
║                                               ║
║  ⚠️  Change the password after first login!   ║
╚═══════════════════════════════════════════════╝
  `);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
