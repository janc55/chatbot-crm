import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkTenants() {
    const tenants = await prisma.tenant.findMany();
    console.log('--- TENANTS ---');
    console.log(JSON.stringify(tenants, null, 2));

    const users = await prisma.user.findMany({ select: { email: true, tenantId: true } });
    console.log('--- USERS ---');
    console.log(JSON.stringify(users, null, 2));

    await prisma.$disconnect();
}

checkTenants();
