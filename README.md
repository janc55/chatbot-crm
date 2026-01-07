# Chatbot UNIOR - WhatsApp University Bot

Un chatbot inteligente para WhatsApp diseñado para universidades, que automatiza la atención a consultas de estudiantes potenciales sobre carreras, costos, requisitos y procesos de inscripción. Utiliza NestJS en el backend, Baileys para la integración con WhatsApp, OpenAI para clasificación inteligente de mensajes, y un frontend en React para el dashboard de administración.

## 🚀 Características Principales

- **Automatización de Atención**: Responde automáticamente a consultas comunes sobre carreras universitarias usando plantillas predefinidas.
- **Integración con WhatsApp**: Conexión estable y multi-dispositivo usando Baileys.
- **Clasificación Inteligente**: Motor híbrido de reglas de keywords + OpenAI para detectar intenciones y seleccionar respuestas apropiadas.
- **Gestión de Leads**: Captura y seguimiento de prospectos con historial de interacciones.
- **Plantillas Administrables**: Sistema CRUD para gestionar respuestas y adjuntos (PDFs, imágenes).
- **Estadísticas y Reportes**: Dashboard con métricas de leads, interacciones y conversiones.
- **Recordatorios Automáticos**: Tareas programadas para seguimiento de leads interesados.
- **Dashboard Web**: Interfaz React para visualizar estadísticas y gestionar plantillas.

## 🛠 Tecnologías Utilizadas

### Backend
- **NestJS**: Framework Node.js para aplicaciones escalables.
- **TypeScript**: Tipado fuerte para mayor robustez.
- **Prisma**: ORM para PostgreSQL con migraciones automáticas.
- **Baileys (@whiskeysockets/baileys)**: Librería para integración con WhatsApp Web.
- **OpenAI**: API para clasificación inteligente de mensajes.
- **RxJS**: Programación reactiva para manejo de eventos.
- **Swagger**: Documentación automática de API.

### Frontend
- **React 19**: Biblioteca para interfaces de usuario.
- **Vite**: Herramienta de build rápida para desarrollo.
- **Tailwind CSS**: Framework CSS utilitario.
- **React Router**: Enrutamiento del lado cliente.
- **Axios**: Cliente HTTP para llamadas a la API.
- **Recharts**: Librería de gráficos para visualización de datos.

### Infraestructura
- **PostgreSQL**: Base de datos relacional.
- **Docker**: Contenedorización para despliegue.
- **Coolify**: Plataforma de despliegue en VPS.

## 🏗 Arquitectura

El proyecto sigue una arquitectura modular con separación clara de responsabilidades:

```
├── src/
│   ├── app.module.ts          # Módulo principal
│   ├── main.ts                # Punto de entrada
│   ├── whatsapp/              # Servicio de WhatsApp (Baileys)
│   ├── leads/                 # Gestión de leads
│   ├── templates/             # Gestión de plantillas
│   ├── interactions/          # Registro de interacciones
│   ├── openai/                # Servicio de IA
│   ├── prisma/                # Servicio de base de datos
│   └── tasks/                 # Tareas programadas
├── client/                    # Frontend React
├── prisma/
│   ├── schema.prisma          # Esquema de base de datos
│   └── migrations/            # Migraciones
├── assets/                    # Archivos estáticos (PDFs)
└── scripts/                   # Scripts de utilidad
```

## 📦 Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- PostgreSQL
- npm o yarn

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd chatbot-unior
```

### 2. Instalar Dependencias del Backend
```bash
npm install
```

### 3. Configurar Variables de Entorno
Crear un archivo `.env` en la raíz del proyecto:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/chatbot_unior"
OPENAI_API_KEY="your-openai-api-key"
PORT=3000
WHATSAPP_SESSION_PATH="./wa_sessions"
```

### 4. Configurar la Base de Datos
```bash
# Generar cliente Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate
```

### 5. Instalar Dependencias del Frontend
```bash
cd client
npm install
cd ..
```

### 6. Construir y Ejecutar
```bash
# Backend
npm run start:dev

# Frontend (en otra terminal)
cd client
npm run dev
```

## 🚀 Uso

### Conexión con WhatsApp
1. Al iniciar el backend, se generará un código QR en la terminal.
2. Escanea el código QR con la aplicación WhatsApp Business en tu teléfono.
3. El bot estará conectado y listo para recibir mensajes.

### Dashboard Web
Accede a `http://localhost:5173` para ver el dashboard con:
- Estadísticas de leads
- Historial de interacciones
- Gestión de plantillas
- Estado del bot

## 📡 API Endpoints

### WhatsApp Webhook
- `POST /webhook/whatsapp` - Procesar mensajes entrantes de WhatsApp
- `GET /webhook/whatsapp/status` - Obtener estado del bot y información del perfil

### Leads
- `GET /leads` - Listar todos los leads
- `GET /leads/:id` - Obtener detalles de un lead específico
- `GET /leads/stats` - Estadísticas generales de leads
- `GET /leads/stats/history` - Historial diario de interacciones
- `PATCH /leads/:id/handover` - Activar/desactivar modo agente humano

### Plantillas
- `POST /templates` - Crear nueva plantilla
- `GET /templates` - Listar todas las plantillas
- `PATCH /templates/:id` - Actualizar plantilla existente

## 🗄 Base de Datos

### Modelos Principales

#### Lead
```sql
- id: String (UUID, PK)
- phone: String (único)
- fullName: String?
- careerInterest: String?
- source: String (default: "unknown")
- status: LeadStatus (enum)
- createdAt: DateTime
- updatedAt: DateTime
- isHandoverActive: Boolean
```

#### Interaction
```sql
- id: String (UUID, PK)
- leadId: String (FK)
- direction: Direction (INBOUND/OUTBOUND)
- messageType: MessageType (TEXT/MEDIA/TEMPLATE)
- content: String
- templateKey: String?
- usedAi: Boolean
- createdAt: DateTime
```

#### Template
```sql
- id: String (UUID, PK)
- key: String (único)
- category: String
- language: String (default: "es")
- content: String
- attachments: String? (JSON)
- followUpSuggested: Boolean
- embedding: Json? (vector OpenAI)
```

### Estados de Lead
- `NUEVO`: Lead recién creado
- `INTERESADO_BROCHURE`: Interesado en información general
- `INTERESADO_COSTOS`: Consultó costos
- `PREINSCRITO`: En proceso de preinscripción
- `INSCRITO`: Completó inscripción
- `DESCARTADO`: No interesado
- `NECESITA_ASESOR`: Requiere atención humana
- `PREINSCRIPCION_EN_PROCESO`: En proceso de preinscripción

## 🎨 Frontend

El dashboard web incluye:

- **Dashboard Principal**: Métricas generales, gráficos de leads por carrera y estado
- **Lista de Leads**: Vista detallada con filtros y búsqueda
- **Gestión de Plantillas**: CRUD para respuestas predefinidas
- **Historial de Interacciones**: Conversaciones completas por lead
- **Estado del Bot**: Información de conexión WhatsApp

### Tecnologías del Frontend
- React con hooks y componentes funcionales
- Tailwind CSS para estilos responsivos
- React Router para navegación
- Axios para llamadas API
- Recharts para visualización de datos

## 🚢 Despliegue

### Con Docker
```bash
# Construir imagen
docker build -t chatbot-unior .

# Ejecutar contenedor
docker run -p 3000:3000 --env-file .env chatbot-unior
```

### Con Docker Compose
```bash
docker-compose up -d
```

### En Coolify
1. Conectar repositorio Git
2. Configurar variables de entorno
3. Configurar comandos de build: `npm install && npm run build`
4. Configurar comando de start: `npm run start:prod`
5. Configurar puerto 3000

## 🔧 Scripts Útiles

```bash
# Regenerar embeddings de plantillas
npm run ts-node scripts/regenerate-embeddings.ts

# Cargar datos de prueba
npm run ts-node scripts/load-test.js

# Verificar plantillas
npm run ts-node scripts/check-templates.ts
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

### Agregando Nuevas Carreras
1. Agregar PDF a `assets/`
2. Crear plantillas en `src/templates/templates.service.ts`
3. Actualizar reglas en `src/whatsapp/whatsapp.service.ts`
4. Reiniciar servidor

## 📝 Licencia

Este proyecto está bajo la licencia UNLICENSED.

## 📞 Soporte

Para soporte técnico o consultas sobre el proyecto, contactar al equipo de desarrollo.
