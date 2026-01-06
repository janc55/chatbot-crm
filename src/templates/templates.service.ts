import { Injectable, OnModuleInit, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Template } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { OpenaiService } from '../openai/openai.service';

@Injectable()
export class TemplatesService implements OnModuleInit {
    private readonly logger = new Logger(TemplatesService.name);

    constructor(
        private prisma: PrismaService,
        @Inject(forwardRef(() => OpenaiService))
        private openaiService: OpenaiService
    ) { }

    async onModuleInit() {
        await this.seedTemplates();
    }

    async seedTemplates() {
        // Load templates from JSON file
        // Try multiple paths to handle dev (src) vs prod (dist) structure differences
        const possiblePaths = [
            path.join(__dirname, '..', 'data', 'templates.json'), // Dev: src/templates -> src/data | Prod (sometimes): dist/templates -> dist/data
            path.join(__dirname, '..', '..', 'data', 'templates.json'), // Prod (current): dist/src/templates -> dist/data
            path.join(__dirname, '..', '..', 'src', 'data', 'templates.json'), // Fallback
            path.join(process.cwd(), 'src', 'data', 'templates.json'), // Absolute fallback to source
        ];

        let filePath = '';
        let initialTemplates = [];

        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                filePath = p;
                break;
            }
        }

        if (!filePath) {
            this.logger.error(`Could not find templates.json in any of the expected paths: ${possiblePaths.join(', ')}`);
            return;
        }

        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            initialTemplates = JSON.parse(fileContent);
            this.logger.log(`Loaded ${initialTemplates.length} templates from ${filePath}`);
        } catch (error) {
            this.logger.error(`Error reading templates.json from ${filePath}: ${error}`);
            return;
        }

        for (const data of initialTemplates) {
            // Check if template exists to avoid re-embedding if not needed
            const existing = await this.prisma.template.findUnique({ where: { key: data.key } });

            let embedding = existing?.embedding;

            // Generate embedding if it's new, different content, or missing embedding
            if (!existing || existing.content !== data.content || !existing.embedding) {
                this.logger.log(`Generating embedding for template: ${data.key}`);
                try {
                    embedding = await this.openaiService.createEmbedding(
                        `KEY: ${data.key}, CATEGORY: ${data.category}. CONTENT: ${data.content}`
                    );
                } catch (e) {
                    this.logger.warn(`Failed to generate embedding for ${data.key}: ${e}`);
                }
            }

            // Using "any" for data because embedding field type Json might conflict with number[] 
            // if not cast properly, but Prisma handles array to Json.
            const dataWithEmbedding = { ...data, embedding: embedding as any };

            await this.prisma.template.upsert({
                where: { key: data.key },
                update: dataWithEmbedding,
                create: dataWithEmbedding,
            });
        }
    }

    async findAll(): Promise<Template[]> {
        return this.prisma.template.findMany();
    }

    async create(data: Partial<Template>): Promise<Template> {
        // Generate embedding before creating
        let embedding = undefined;
        if (data.content && data.key) {
            embedding = await this.openaiService.createEmbedding(
                `KEY: ${data.key}, CATEGORY: ${data.category}. CONTENT: ${data.content}`
            );
        }

        const { key, category, content, attachments, followUpSuggested, language } = data;

        return this.prisma.template.create({
            data: {
                key: key as string,
                category: category as string,
                content: content as string,
                embedding: embedding ? embedding as any : undefined,
                ...(language ? { language } : {}),
                ...(attachments !== undefined ? { attachments } : {}),
                ...(followUpSuggested !== undefined ? { followUpSuggested } : {}),
            },
        });
    }

    async findByKey(key: string): Promise<Template | null> {
        return this.prisma.template.findUnique({ where: { key } });
    }

    async getContextSummary(): Promise<string> {
        // This method will be deprecated or simplified by RAG
        const templates = await this.prisma.template.findMany({
            take: 50, // Limit just in case
            select: { key: true, category: true, content: true },
        });
        return templates.map(t => `- KEY: ${t.key} (Cat: ${t.category}): ${(t.content || '').substring(0, 100)}...`).join('\n');
    }

    async findMostRelevant(queryText: string, limit: number = 5): Promise<Template[]> {
        const queryEmbedding = await this.openaiService.createEmbedding(queryText);
        const templates = await this.prisma.template.findMany({
            where: { embedding: { not: null } }
        });

        // Calculate Cosine Similarity locally
        const scored = templates.map(t => {
            const vec = t.embedding as unknown as number[];
            const score = this.cosineSimilarity(queryEmbedding, vec);
            return { ...t, score };
        });

        // Sort descending
        scored.sort((a, b) => b.score - a.score);

        return scored.slice(0, limit);
    }

    private cosineSimilarity(vecA: number[], vecB: number[]): number {
        if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
        let dot = 0.0;
        let normA = 0.0;
        let normB = 0.0;
        for (let i = 0; i < vecA.length; i++) {
            dot += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        if (normA === 0 || normB === 0) return 0;
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    async update(id: string, data: Partial<Template>): Promise<Template> {
        // Function to fetch current data to combine for embedding
        const current = await this.prisma.template.findUnique({ where: { id } });
        if (!current) throw new Error('Template not found');

        let embedding = current.embedding;

        // If content changed, regenerate embedding
        if (data.content && data.content !== current.content) {
            const newContent = data.content;
            const newKey = data.key || current.key;
            const newCat = data.category || current.category;
            embedding = await this.openaiService.createEmbedding(
                `KEY: ${newKey}, CATEGORY: ${newCat}. CONTENT: ${newContent}`
            ) as any;
        }

        return this.prisma.template.update({
            where: { id },
            data: { ...data, embedding },
        });
    }
}
