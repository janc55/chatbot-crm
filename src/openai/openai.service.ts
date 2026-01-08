import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface ClassificationResult {
    intent: string;
    template_key: string | null;
    needs_human: boolean;
    extra_text?: string;
}

@Injectable()
export class OpenaiService {
    private openai: OpenAI;
    private readonly logger = new Logger(OpenaiService.name);

    constructor(private configService: ConfigService) {
        this.openai = new OpenAI({
            apiKey: this.configService.get<string>('OPENAI_API_KEY'),
        });
    }

    async createEmbedding(text: string): Promise<number[]> {
        const response = await this.openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text,
            encoding_format: 'float',
        });
        return response.data[0].embedding;
    }

    async classifyMessage(
        userMessage: string,
        contextSummary: string,
        conversationHistory: string = '',
    ): Promise<ClassificationResult> {
        try {
            const systemPrompt = `
      Eres un asistente de atención al cliente para una universidad.
      Tu tarea es CLASIFICAR el mensaje del usuario y seleccionar una plantilla de respuesta SI existe.
      NO inventes precios, fechas ni requisitos.
      
      Historial de conversación reciente:
      ${conversationHistory}

      Contexto de plantillas disponibles (Resumen encontrado por RAG):
      ${contextSummary}

      Debes responder SIEMPRE con un JSON válido con este formato:
      {
        "intent": "string (ej. COSTOS_MEDICINA, BROCHURE_DERECHO, SALUDO, ETC)",
        "template_key": "string | null (la clave exacta de la plantilla a usar)",
        "needs_human": boolean (true si no hay plantilla clara o es una queja/caso complejo),
        "extra_text": "string (opcional, breve frase para suavizar o enganchar, máximo 1 linea)"
      }
      
      Si el usuario pide algo que NO está en el contexto, needs_human = true.
      Si el usuario pide "requisitos" o "costos" y el historial o contexto implica una carrera específica, busca la plantilla específica (ej. requisitos_gth).
      `;

            const completion = await this.openai.chat.completions.create({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userMessage },
                ],
                model: 'gpt-3.5-turbo-0125', // Fast and JSON reliable
                response_format: { type: 'json_object' },
                temperature: 0.1,
            });

            const content = completion.choices[0].message.content;
            return JSON.parse(content) as ClassificationResult;
        } catch (error) {
            this.logger.error('Error classifying message with OpenAI', error);
            // Fallback
            return {
                intent: 'UNKNOWN',
                template_key: null,
                needs_human: true,
            };
        }
    }

    async generateSuggestions(prompt: string): Promise<string[]> {
        try {
            const completion = await this.openai.chat.completions.create({
                messages: [
                    { role: 'system', content: 'Eres un asistente que genera sugerencias de respuestas para asesores universitarios.' },
                    { role: 'user', content: prompt },
                ],
                model: 'gpt-3.5-turbo-0125',
                temperature: 0.7,
            });

            const content = completion.choices[0].message.content;
            // Try to parse as JSON array
            try {
                const parsed = JSON.parse(content);
                if (Array.isArray(parsed)) {
                    return parsed.slice(0, 3); // Max 3 suggestions
                }
            } catch {
                // If not JSON, split by newlines
                return content
                    .split('\n')
                    .filter(line => line.trim().length > 0)
                    .slice(0, 3);
            }
            return [content];
        } catch (error) {
            this.logger.error('Error generating suggestions with OpenAI', error);
            return [];
        }
    }
}
