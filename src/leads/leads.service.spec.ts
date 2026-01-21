import { Test, TestingModule } from '@nestjs/testing';
import { LeadsService } from './leads.service';
import { PrismaService } from '../prisma/prisma.service';
import { LeadStatus } from '@prisma/client';

describe('LeadsService - findStaleLeads', () => {
    let service: LeadsService;
    let prismaService: PrismaService;

    const mockPrismaService = {
        lead: {
            findMany: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LeadsService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<LeadsService>(LeadsService);
        prismaService = module.get<PrismaService>(PrismaService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return leads with last interaction older than specified hours', async () => {
        const now = new Date();
        const twentyFiveHoursAgo = new Date(now.getTime() - 25 * 60 * 60 * 1000);
        const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);

        const mockLeads = [
            {
                id: '1',
                phone: '59178123456',
                status: LeadStatus.INTERESADO_BROCHURE,
                isHandoverActive: false,
                createdAt: twentyFiveHoursAgo,
                interactions: [
                    {
                        id: 'int1',
                        createdAt: twentyFiveHoursAgo,
                        content: 'Old message',
                    },
                ],
            },
            {
                id: '2',
                phone: '59178234567',
                status: LeadStatus.INTERESADO_COSTOS,
                isHandoverActive: false,
                createdAt: oneHourAgo,
                interactions: [
                    {
                        id: 'int2',
                        createdAt: oneHourAgo,
                        content: 'Recent message',
                    },
                ],
            },
        ];

        mockPrismaService.lead.findMany.mockResolvedValue(mockLeads);

        const result = await service.findStaleLeads(24);

        // Should return only the lead with interaction > 24 hours old
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('1');
        expect(result[0]).not.toHaveProperty('interactions');
    });

    it('should exclude leads with active handover', async () => {
        const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);

        mockPrismaService.lead.findMany.mockResolvedValue([]);

        await service.findStaleLeads(24);

        expect(mockPrismaService.lead.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    isHandoverActive: false,
                }),
            }),
        );
    });

    it('should include leads with no interactions if created before cutoff', async () => {
        const now = new Date();
        const twentyFiveHoursAgo = new Date(now.getTime() - 25 * 60 * 60 * 1000);

        const mockLeads = [
            {
                id: '1',
                phone: '59178123456',
                status: LeadStatus.INTERESADO_BROCHURE,
                isHandoverActive: false,
                createdAt: twentyFiveHoursAgo,
                interactions: [], // No interactions
            },
        ];

        mockPrismaService.lead.findMany.mockResolvedValue(mockLeads);

        const result = await service.findStaleLeads(24);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('1');
    });

    it('should exclude leads with no interactions if created after cutoff', async () => {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);

        const mockLeads = [
            {
                id: '1',
                phone: '59178123456',
                status: LeadStatus.INTERESADO_BROCHURE,
                isHandoverActive: false,
                createdAt: oneHourAgo,
                interactions: [], // No interactions
            },
        ];

        mockPrismaService.lead.findMany.mockResolvedValue(mockLeads);

        const result = await service.findStaleLeads(24);

        expect(result).toHaveLength(0);
    });
});
