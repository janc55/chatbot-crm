
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { OpenaiService } from '../src/openai/openai.service';
import { PrismaService } from '../src/prisma/prisma.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const prisma = app.get(PrismaService);
    const openai = app.get(OpenaiService);

    console.log('Fetching templates...');
    const templates = await prisma.template.findMany();

    const missing = templates.filter(t => !t.embedding || (Array.isArray(t.embedding) && t.embedding.length === 0));
    console.log(`Found ${missing.length} templates needing embeddings.`);

    for (const t of missing) {
        console.log(`Generating embedding for [${t.key}]...`);
        try {
            const text = `KEY: ${t.key}, CATEGORY: ${t.category}. CONTENT: ${t.content}`;
            const embedding = await openai.createEmbedding(text);

            await prisma.template.update({
                where: { id: t.id },
                data: { embedding: embedding as any }
            });
            console.log(`Updated [${t.key}] successfully.`);
        } catch (e) {
            console.error(`Failed to update [${t.key}]:`, e);
        }
    }

    await app.close();
}

bootstrap();
