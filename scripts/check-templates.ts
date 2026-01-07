
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking templates in DB...');
    const templates = await prisma.template.findMany({
        where: {
            key: {
                contains: 'requisitos',
            },
        },
    });

    if (templates.length === 0) {
        console.log('No templates found with "requisitos" in key.');
    } else {
        console.log(`Found ${templates.length} templates:`);
        templates.forEach(t => {
            console.log(`- Key: ${t.key}, Category: ${t.category}, Has Embedding: ${!!t.embedding}`);
            if (t.embedding) {
                const emb = t.embedding as number[];
                console.log(`  Embedding length: ${Array.isArray(emb) ? emb.length : 'Not an array'}`);
            }
        });
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
