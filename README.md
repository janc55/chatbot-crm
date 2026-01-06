# Chatbot Universitario (WhatsApp + NestJS + OpenAI)

Este proyecto implementa un chatbot para inscripciones universitarias automatizado con Baileys (WhatsApp Web), NestJS y OpenAI.

## Estructura
- **src/whatsapp**: Lógica de conexión y manejo de mensajes.
- **src/leads**: Gestión de base de datos de usuarios.
- **src/templates**: Plantillas de respuestas (FAQs, Brochures).
- **src/openai**: Clasificador inteligente.
- **src/interactions**: Registro de auditoría.

## Requisitos Previos
- Node.js 18+ (Local)
- Docker & Docker Compose (Recomendado)
- Cuenta de OpenAI (API Key)
- Celular con WhatsApp para escanear el QR.

## Configuración Local

1. **Instalar dependencias**
   ```bash
   npm install
   ```

2. **Configurar entorno**
   Copia el archivo `.env.example` a `.env` y edita las variables:
   ```bash
   cp .env.example .env
   ```
   Asegúrate de poner tu `OPENAI_API_KEY`.

3. **Base de datos (Prisma)**
   Levanta una base de datos Postgres (o usa el docker-compose):
   ```bash
   docker-compose up -d db
   ```
   Luego ejecuta las migraciones:
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Ejecutar**
   ```bash
   npm run start:dev
   ```
   - Al iniciar, verás un código QR en la terminal. Escanea con WhatsApp para vincular.
   
## Despliegue en Coolify / VPS

1. **Dockerfile**: El repositorio incluye un `Dockerfile` optimizado.
2. **Variables en Coolify**:
   - `PORT`: 3000
   - `DATABASE_URL`: `postgresql://user:pass@host:5432/db` (Usa el servicio de BD de Coolify o externa).
   - `OPENAI_API_KEY`: Tu clave.
   - `WHATSAPP_SESSION_PATH`: `/app/wa_sessions` (Recomendado montar un volumen persistente en esta ruta para no perder la sesión al reiniciar).

3. **Volúmenes**:
   - Monta un volumen para `./wa_sessions` para persistencia de la sesión de WhatsApp.

## Endpoints Principales
- `POST /webhook/whatsapp`: Endpoint para recibir mensajes (uso interno o webhook externo).
- `GET /leads`: Listado de prospectos.
- `GET /leads/stats`: Estadísticas.
- Docs Swagger: `http://localhost:3000/api`
