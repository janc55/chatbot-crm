
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
    console.log('Fetching templates...');
    const allTemplates = await prisma.template.findMany();
    console.log(`Total templates in DB: ${allTemplates.length}`);

    // Debug log first 5
    allTemplates.slice(0, 5).forEach(t => {
        const hasEmb = t.embedding && Array.isArray(t.embedding) && t.embedding.length > 0;
        console.log(`- [${t.key}]: hasEmbedding=${hasEmb}`);
    });

    // Filter for missing embeddings
    const missing = allTemplates.filter(t => !t.embedding || (Array.isArray(t.embedding) && t.embedding.length === 0));
    console.log(`Found ${missing.length} templates needing embeddings.`);

    for (const t of missing) {
        console.log(`Generating embedding for [${t.key}]...`);
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

            // Small delay to avoid rate limits
            await new Promise(r => setTimeout(r, 200));

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
