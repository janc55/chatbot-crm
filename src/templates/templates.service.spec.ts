import { Test, TestingModule } from '@nestjs/testing';
import { TemplatesService } from './templates.service';
import { PrismaService } from '../prisma/prisma.service';
import { OpenaiService } from '../openai/openai.service';

describe('TemplatesService', () => {
    let service: TemplatesService;
    let prisma: PrismaService;
    let openai: OpenaiService;

    const mockPrisma = {
        template: {
            upsert: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    };

    const mockOpenai = {
        createEmbedding: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TemplatesService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: OpenaiService, useValue: mockOpenai },
            ],
        }).compile();

        service = module.get<TemplatesService>(TemplatesService);
        prisma = module.get<PrismaService>(PrismaService);
        openai = module.get<OpenaiService>(OpenaiService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findMostRelevant', () => {
        it('should return templates ordered by similarity', async () => {
            const queryVector = [1, 0, 0];
            const templates = [
                { key: 't1', content: 'A', embedding: [0, 1, 0] }, // Orthogonal (0)
                { key: 't2', content: 'B', embedding: [1, 0, 0] }, // Identical (1)
                { key: 't3', content: 'C', embedding: [0.5, 0.5, 0] }, // Mixed (~0.7)
            ];

            mockOpenai.createEmbedding.mockResolvedValue(queryVector);
            mockPrisma.template.findMany.mockResolvedValue(templates);

            const result = await service.findMostRelevant('query', 3);

            expect(result[0].key).toBe('t2');
            expect(result[1].key).toBe('t3');
            expect(result[2].key).toBe('t1');
            expect(mockOpenai.createEmbedding).toHaveBeenCalledWith('query');
        });
    });

    describe('create', () => {
        it('should generate embedding and create template', async () => {
            const dto = { key: 'new', category: 'cat', content: 'content' };
            const embedding = [0.1, 0.2];

            mockOpenai.createEmbedding.mockResolvedValue(embedding);
            mockPrisma.template.create.mockResolvedValue({ ...dto, embedding, id: '1' });

            await service.create(dto);

            expect(mockOpenai.createEmbedding).toHaveBeenCalled();
            expect(mockPrisma.template.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    embedding: embedding
                })
            }));
        });
    });
});
