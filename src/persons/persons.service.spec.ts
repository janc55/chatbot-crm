import { Test, TestingModule } from '@nestjs/testing';
import { PersonsService } from './persons.service';
import { PrismaService } from '../prisma/prisma.service';
import { LeadStatus, PersonType } from '@prisma/client';

describe('PersonsService - findStaleLeads', () => {
    let service: PersonsService;
    let prisma: PrismaService;

    const mockPrismaService = {
        person: {
            findMany: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PersonsService,
                {
                    provide: PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();

        service = module.get<PersonsService>(PersonsService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should return persons with last interaction older than specified hours', async () => {
        const cutoff = new Date();
        cutoff.setHours(cutoff.getHours() - 24);

        const mockPersons = [
            {
                id: '1',
                phone: '123456',
                status: LeadStatus.INTERESADO_BROCHURE,
                type: PersonType.LEAD,
                isHandoverActive: false,
                createdAt: new Date(cutoff.getTime() - 1000 * 60 * 60), // Created 25h ago
                interactions: [
                    {
                        createdAt: new Date(cutoff.getTime() - 1000 * 60 * 60), // Last interaction 25h ago
                    },
                ],
            },
            {
                id: '2',
                phone: '654321',
                status: LeadStatus.INTERESADO_COSTOS,
                type: PersonType.LEAD,
                isHandoverActive: false,
                createdAt: new Date(),
                interactions: [
                    {
                        createdAt: new Date(), // Last interaction now
                    },
                ],
            },
        ];

        mockPrismaService.person.findMany.mockResolvedValue(mockPersons);

        const result = await service.findStaleLeads('tenant-1', 24);

        expect(result.length).toBe(1);
        expect(result[0].id).toBe('1');
    });

    it('should exclude persons with active handover', async () => {
        mockPrismaService.person.findMany.mockResolvedValue([]);

        await service.findStaleLeads('tenant-1', 24);

        expect(mockPrismaService.person.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    isHandoverActive: false,
                }),
            }),
        );
    });

    it('should include persons with no interactions if created before cutoff', async () => {
        const cutoff = new Date();
        cutoff.setHours(cutoff.getHours() - 24);

        const mockPersons = [
            {
                id: '1',
                phone: '123456',
                status: LeadStatus.INTERESADO_BROCHURE,
                type: PersonType.LEAD,
                isHandoverActive: false,
                createdAt: new Date(cutoff.getTime() - 1000 * 60 * 60), // 25h ago
                interactions: [],
            },
        ];

        mockPrismaService.person.findMany.mockResolvedValue(mockPersons);

        const result = await service.findStaleLeads('tenant-1', 24);

        expect(result.length).toBe(1);
    });
});
