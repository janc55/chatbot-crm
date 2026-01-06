import { Test, TestingModule } from '@nestjs/testing';
import { OpenaiService } from './openai.service';
import { ConfigService } from '@nestjs/config';

// Mock OpenAI class
jest.mock('openai', () => {
    return {
        default: jest.fn().mockImplementation(() => ({
            chat: {
                completions: {
                    create: jest.fn(),
                },
            },
            embeddings: {
                create: jest.fn(),
            },
        })),
    };
});

describe('OpenaiService', () => {
    let service: OpenaiService;

    const mockConfigService = {
        get: jest.fn().mockReturnValue('fake-key'),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OpenaiService,
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        service = module.get<OpenaiService>(OpenaiService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // Note: Testing private properties or external lib wrappers is tricky without better DI or exposing the lib instance.
    // For now we assume constructor worked if service is defined.
    // We can interpret success if the classification method runs.

    it('should create embedding', async () => {
        // Accessing the mocked instance to setup return value
        const openaiInstance = (service as any).openai;
        openaiInstance.embeddings.create.mockResolvedValue({
            data: [{ embedding: [0.1, 0.2] }]
        });

        const embedding = await service.createEmbedding('test');
        expect(embedding).toEqual([0.1, 0.2]);
        expect(openaiInstance.embeddings.create).toHaveBeenCalled();
    });

    it('should classify message', async () => {
        const openaiInstance = (service as any).openai;
        const mockResponse = { intent: 'TEST', template_key: 't1', needs_human: false };

        openaiInstance.chat.completions.create.mockResolvedValue({
            choices: [
                { message: { content: JSON.stringify(mockResponse) } }
            ]
        });

        const result = await service.classifyMessage('hello', 'context');
        expect(result).toEqual(mockResponse);
    });
});
