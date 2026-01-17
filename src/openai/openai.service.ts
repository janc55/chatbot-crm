import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export interface ClassificationResult {
    intents: string[];
    template_keys: string[];
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
      Tu tarea es ANALIZAR el mensaje del usuario y seleccionar TODAS las plantillas de respuesta pertinentes SI existen.
      
      CONSIDERACIONES CRÍTICAS:
      1. RÁFAGAS Y FRAGMENTACIÓN: El usuario puede enviar ráfagas que se agrupan. A veces las palabras vienen cortadas por espacios (ej: "re qui sitos"). Si detectas palabras fragmentadas que unidas forman un término clave del contexto, interprétalo como tal.
      2. REDUNDANCIA: Revisa el historial. Si una plantilla ya fue enviada en los últimos 2-3 mensajes y el usuario no ha cambiado de tema (ej: solo envió un "?"), NO la vuelvas a incluir en template_keys a menos que sea estrictamente necesario.
      3. AMBIGÜEDAD: Si el mensaje consolidado es solo puntuación (ej: "?") o ruidos (ej: "asdf") y no hay un intent claro en el historial reciente, devuelve template_keys vacío.
      4. NO inventes precios, fechas ni requisitos.
      
      Historial de conversación reciente:
      ${conversationHistory}

      Contexto de plantillas disponibles (Resumen encontrado por RAG):
      ${contextSummary}

      Debes responder SIEMPRE con un JSON válido con este formato:
      {
        "intents": ["string", "string"], (lista de intents identificados ej. SALUDO, COSTOS_MEDICINA)
        "template_keys": ["string"], (lista con las claves exactas de las plantillas a usar en orden lógico)
        "needs_human": boolean (true si alguna parte crítica no tiene plantilla clara o es una queja/caso complejo),
        "extra_text": "string (opcional, breve frase para suavizar o enganchar al final, máximo 1 linea)"
      }
      
      Si el usuario pide algo que NO está en el contexto y es crítico, needs_human = true.
      Si el usuario pide "requisitos" o "costos" y el historial o contexto implica una carrera específica, busca la plantilla específica (ej. requisitos_gth).
      Manten la lista de template_keys en un orden de respuesta natural (ej. [bienvenida, brochure_medicina, costos_medicina]).
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
                intents: ['UNKNOWN'],
                template_keys: [],
                needs_human: true,
            };
        }
    }

    async generateSuggestions(conversationContext: string, lastUserMessage: string, careerContext: string): Promise<string[]> {
        try {
            const systemPrompt = `Eres un asistente que ayuda a asesores universitarios a responder consultas de estudiantes.
Genera exactamente 3 sugerencias de respuestas cortas, profesionales y útiles.
Cada sugerencia debe ser una oración completa de máximo 80 caracteres.
Las respuestas deben ser naturales, amigables y específicas al contexto.
Debes responder en formato JSON con una clave "sugerencias" que contenga un array de 3 strings.`;

            const userPrompt = `Contexto de la conversación reciente:
${conversationContext}

${careerContext}

Último mensaje del estudiante: "${lastUserMessage}"

Genera 3 sugerencias de respuestas específicas y útiles que un asesor podría usar para responder esta pregunta.
Las sugerencias deben ser directas y responder al tema específico que pregunta el estudiante.
Responde en formato JSON con la estructura: {"sugerencias": ["respuesta1", "respuesta2", "respuesta3"]}`;

            const completion = await this.openai.chat.completions.create({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt },
                ],
                model: 'gpt-3.5-turbo-0125',
                response_format: { type: 'json_object' },
                temperature: 0.7,
            });

            const content = completion.choices[0].message.content;

            // Parse JSON response
            const parsed = JSON.parse(content);

            // Extract suggestions from various possible formats
            let suggestions: string[] = [];

            if (Array.isArray(parsed)) {
                suggestions = parsed;
            } else if (parsed.sugerencias && Array.isArray(parsed.sugerencias)) {
                suggestions = parsed.sugerencias;
            } else if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
                suggestions = parsed.suggestions;
            } else if (parsed.respuestas && Array.isArray(parsed.respuestas)) {
                suggestions = parsed.respuestas;
            } else {
                // Try to extract any array from the object
                const values = Object.values(parsed);
                const arrayValue = values.find(v => Array.isArray(v));
                if (arrayValue) {
                    suggestions = arrayValue as string[];
                }
            }

            // Clean and validate suggestions
            suggestions = suggestions
                .filter(s => typeof s === 'string' && s.trim().length > 0)
                .map(s => s.trim())
                .slice(0, 3);

            // If we got valid suggestions, return them
            if (suggestions.length > 0) {
                return suggestions;
            }

            // Fallback if parsing failed
            return [
                'Claro, déjame ayudarte con eso.',
                '¿Necesitas más información?',
                'Estoy aquí para resolver tus dudas.',
            ];
        } catch (error) {
            this.logger.error('Error generating suggestions with OpenAI', error);
            return [
                'Claro, déjame ayudarte con eso.',
                '¿Necesitas más información?',
                'Estoy aquí para resolver tus dudas.',
            ];
        }
    }
}
