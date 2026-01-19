import { Test, TestingModule } from '@nestjs/testing';
import { LeadsService } from './leads.service';
import { PrismaService } from '../prisma/prisma.service';
import { LeadStatus } from '@prisma/client';

describe('LeadsService', () => {
    let service: LeadsService;
    let prisma: PrismaService;

    const mockPrisma = {
        lead: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
            groupBy: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LeadsService,
                { provide: PrismaService, useValue: mockPrisma },
            ],
        }).compile();

        service = module.get<LeadsService>(LeadsService);
        prisma = module.get<PrismaService>(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findOrCreate', () => {
        it('should return existing lead', async () => {
            const lead = { id: '1', phone: '123' };
            mockPrisma.lead.findUnique.mockResolvedValue(lead);

            const result = await service.findOrCreate('123', 'tenant-1');
            expect(result).toEqual(lead);
            expect(mockPrisma.lead.create).not.toHaveBeenCalled();
        });

        it('should create new lead if not found', async () => {
            const lead = { id: '1', phone: '123', tenantId: 'tenant-1', status: LeadStatus.NUEVO };
            mockPrisma.lead.findUnique.mockResolvedValue(null);
            mockPrisma.lead.create.mockResolvedValue(lead);

            const result = await service.findOrCreate('123', 'tenant-1', 'John');
            expect(result).toEqual(lead);
            expect(mockPrisma.lead.create).toHaveBeenCalledWith({
                data: { phone: '123', tenantId: 'tenant-1', fullName: 'John', status: LeadStatus.NUEVO },
            });
        });
    });

    describe('getStats', () => {
        it('should return statistics including career interest', async () => {
            mockPrisma.lead.count.mockResolvedValue(10);
            mockPrisma.lead.groupBy
                .mockResolvedValueOnce([{ status: 'NUEVO', _count: { status: 5 } }]) // byStatus
                .mockResolvedValueOnce([{ careerInterest: 'MEDICINA', _count: { careerInterest: 3 } }]); // byCareer

            const result = await service.getStats();

            expect(result.total).toBe(10);
            expect(result.byStatus).toBeDefined();
            expect(result.byCareer).toBeDefined();
            expect(mockPrisma.lead.groupBy).toHaveBeenCalledTimes(2);
        });
    });

    describe('toggleHandover', () => {
        it('should update isHandoverActive', async () => {
            const id = '123';
            const status = true;
            mockPrisma.lead.update.mockResolvedValue({ id, isHandoverActive: status });

            await service.toggleHandover(id, status);

            expect(mockPrisma.lead.update).toHaveBeenCalledWith({
                where: { id },
                data: { isHandoverActive: status },
            });
        });
    });
});
