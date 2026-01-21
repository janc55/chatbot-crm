import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PersonsService } from '../src/persons/persons.service';

describe('AppController (e2e)', () => {
    let app: INestApplication;

    const mockPersonsService = {
        findAll: jest.fn().mockResolvedValue([]),
        getStats: jest.fn().mockResolvedValue({ total: 0, byPipeline: [], byCareer: [] }),
        findOne: jest.fn().mockResolvedValue({ id: '1', phone: '12355555555', interactions: [] }),
    };

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(PersonsService)
            .useValue(mockPersonsService)
            .compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('/persons (GET)', () => {
        return request(app.getHttpServer())
            .get('/persons')
            .expect(200)
            .expect([]);
    });

    it('/persons/1 (GET)', () => {
        return request(app.getHttpServer())
            .get('/persons/1')
            .expect(200)
            .expect(res => {
                expect(res.body.phone).toBe('12355555555');
            });
    });
});
