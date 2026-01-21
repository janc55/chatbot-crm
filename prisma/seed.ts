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

    // 3. Seed Default Pipeline Stages
    const defaults = [
        { name: 'new', displayName: 'Nuevo', order: 1, color: '#3B82F6' },
        { name: 'contacted', displayName: 'Contactado', order: 2, color: '#F59E0B' },
        { name: 'qualified', displayName: 'Calificado', order: 3, color: '#10B981' },
        { name: 'proposal', displayName: 'Propuesta Enviada', order: 4, color: '#8B5CF6' },
        { name: 'negotiation', displayName: 'Negociación', order: 5, color: '#EC4899' },
        { name: 'won', displayName: 'Ganado', order: 6, color: '#059669', isFinal: true },
        { name: 'lost', displayName: 'Perdido', order: 7, color: '#DC2626', isFinal: true },
    ];

    for (const stage of defaults) {
        await prisma.pipelineStage.upsert({
            where: {
                name_tenantId: {
                    name: stage.name,
                    tenantId: tenant.id,
                },
            },
            update: {},
            create: {
                ...stage,
                tenantId: tenant.id,
            },
        });
    }
    console.log('Default pipeline stages seeded.');

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
