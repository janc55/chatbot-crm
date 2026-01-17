import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting seed...');

    // 1. Create Default Tenant
    const tenant = await prisma.tenant.upsert({
        where: { domain: 'unior.edu.bo' },
        update: {},
        create: {
            name: 'Universidad UNIOR',
            domain: 'unior.edu.bo',
        },
    });
    console.log(`Tenant created/found: ${tenant.name}`);

    // 2. Create Admin User
    const adminEmail = 'admin@unior.edu.bo';
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            password: hashedPassword,
            fullName: 'Super Admin',
            role: Role.ADMIN,
            tenantId: tenant.id,
        },
    });
    console.log(`Admin user created/found: ${admin.email}`);

    // 3. Link existing data to the new tenant (Optional but recommended for cleanliness)
    await prisma.lead.updateMany({
        where: { tenantId: null },
        data: { tenantId: tenant.id },
    });

    await prisma.template.updateMany({
        where: { tenantId: null },
        data: { tenantId: tenant.id },
    });

    await prisma.setting.updateMany({
        where: { tenantId: null },
        data: { tenantId: tenant.id },
    });

    console.log('Seed completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
