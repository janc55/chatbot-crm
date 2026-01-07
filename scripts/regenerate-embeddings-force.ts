
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Fix dotenv loading relative to scripts folder
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
    console.log('Fetching "requisitos" templates...');
    const reqTemplates = await prisma.template.findMany({
        where: {
            key: { contains: 'requisitos' }
        }
    });

    console.log(`Found ${reqTemplates.length} "requisitos" templates.`);

    if (reqTemplates.length === 0) {
        console.error('CRITICAL: No "requisitos" templates found. Please add them via CRUD or check DB.');
        return;
    }

    for (const t of reqTemplates) {
        console.log(`Forcing embedding regeneration for [${t.key}]...`);
        try {
            const text = `KEY: ${t.key}, CATEGORY: ${t.category}. CONTENT: ${t.content}`;
            const response = await openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: text,
                encoding_format: 'float',
            });
            const embedding = response.data[0].embedding;

            await prisma.template.update({
                where: { id: t.id },
                data: { embedding: embedding as any }
            });
            console.log(`Updated [${t.key}] successfully.`);

        } catch (e) {
            console.error(`Failed to update [${t.key}]:`, e);
        }
    }

    console.log('Done!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
