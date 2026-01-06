# SPECS – WhatsApp Chatbot Universitario (Node.js + Baileys + OpenAI + Coolify)

## 1. Visión del proyecto

Construir un sistema de chatbot para la línea oficial de WhatsApp de la universidad, capaz de:

- Atender en automático el pico de mensajes durante la etapa de inscripciones.  
- Responder con **plantillas predefinidas** (equivalentes a respuestas rápidas de WhatsApp Business) para mantener información oficial y consistente.  
- Usar **OpenAI** solo como clasificador/selector de plantillas y para mejorar el tono, sin inventar precios ni requisitos.  
- Capturar y gestionar **leads** (prospectos), registrar interacciones, y exponer **estadísticas y reportes** para el equipo de marketing.  
- Ejecutarse en un **VPS** y desplegarse usando **Coolify**, con contenedores Docker. [web:32][web:35][web:41]

---

## 2. Objetivos y alcance

### Objetivos principales

1. Automatizar el flujo de atención en WhatsApp para consultas sobre:
   - Carreras (especialmente Medicina y otras).  
   - Costos, requisitos, horarios, modalidades, convalidaciones, requisitos para extranjeros, ubicación, procesos académicos.  
2. Centralizar la información de leads y su historial de conversación.  
3. Proveer endpoints/API para estadísticas y seguimiento.  
4. Proveer una arquitectura lista para despliegue en Coolify.

### Fuera de alcance (v1)

- Panel web visual completo (React/Vue) avanzado para administración (se deja preparado, pero no es requisito duro).  
- Integración directa con el sistema académico interno (matrícula) de la universidad.  
- Manejo de múltiples números de WhatsApp en paralelo (v1 solo 1 número).

---

## 3. Usuarios y casos de uso

### Perfiles

- **Prospecto/estudiante**: persona que escribe por WhatsApp pidiendo información.  
- **Community manager / staff de marketing**: usa el sistema para ver leads, revisar estadísticas, actualizar plantillas.  
- **Administrador técnico**: se encarga de despliegue, monitoreo y mantenimiento.

### Casos de uso clave

1. **Primer contacto desde anuncio**
   - El usuario escribe: “Hola, me gustaría información de la carrera de Medicina”.  
   - El sistema detecta la carrera (Medicina), crea/actualiza el lead y responde con el brochure de Medicina y un texto de bienvenida.  

2. **Consulta de costos**
   - El usuario pregunta: “¿Cuánto cuesta la carrera?” o similar.  
   - El sistema detecta la intención de costos, responde con plantilla `costos_<carrera>` y registra la interacción.

3. **Consulta de requisitos, horarios, modalidades, etc.**
   - El usuario pregunta por requisitos, horarios de atención, ubicación, modalidades, requisitos para extranjeros, convalidaciones.  
   - El sistema responde con plantillas específicas/FAQ.

4. **Gancho hacia la inscripción**
   - Después de enviar brochure/costos/requisitos, el bot agrega un mensaje tipo:  
     - “Si deseas, puedo ayudarte a reservar tu cupo ahora mismo, ¿te gustaría que continuemos con la preinscripción?”.  
   - Si el usuario responde positivamente, se cambia el estado del lead y se registra este interés.

5. **Derivación a asesor humano**
   - Para consultas complejas o fuera de las FAQs, el sistema:
     - Marca el lead como `NECESITA_ASESOR`.  
     - Envía un mensaje indicando que un asesor lo contactará.

6. **Reportes y estadísticas**
   - El staff puede consultar vía API:
     - Leads por carrera, rango de fechas y estado.  
     - Total de interacciones, cuántas fueron automáticas vs derivadas a humano.  

---

## 4. Requisitos funcionales

### 4.1 Gestión de conversación y plantillas

- El sistema debe:
  - Escuchar mensajes entrantes de WhatsApp mediante Baileys. [web:7][web:33]  
  - Normalizar el texto y enviar el contenido a un endpoint interno del backend.  
  - Detectar la intención mediante:
    - Motor de reglas de keywords.  
    - OpenAI como clasificador, cuando las reglas no sean suficientes. [web:18][web:21]  
  - Seleccionar plantillas desde una tabla `templates` (BD).  
  - Enviar la respuesta de vuelta a WhatsApp (texto y adjuntos).

- Las plantillas deben ser administrables via API (CRUD básico):
  - Crear nuevas plantillas.  
  - Actualizar contenido de texto.  
  - Actualizar/definir adjuntos (ruta o URL de brochures, imágenes, etc.).  

### 4.2 Gestión de leads

- Cuando llega un mensaje de un número nuevo:
  - Crear un registro en `leads`.  
- Si el número ya existe:
  - Actualizar datos (ej. carrera de interés si se detecta).  
- Debe guardar:
  - Teléfono, nombre (si se extrae), carrera de interés, fuente (ej. “Facebook Ads Campaña X”), estado del lead y timestamps.

### 4.3 Registro de interacciones

- Cada mensaje de entrada/salida se registra en `interactions`:
  - Dirección (`INBOUND` / `OUTBOUND`).  
  - Tipo (`TEXT`, `MEDIA`, `TEMPLATE`).  
  - Contenido y `template_key` si aplica.  
  - Flag `used_ai` para marcar si hubo intervención de OpenAI.

### 4.4 IA controlada con OpenAI

- OpenAI se usa únicamente para:
  - Clasificar el mensaje cuando no hay match de reglas claro.  
  - Sugerir `template_key` y `intent`.  
  - Indicar si la consulta debe derivarse a humano.

- Debe respetar:
  - Prompt de sistema estricto:  
    - Solo usar información dada en FAQs/plantillas (resúmenes).  
    - No inventar precios, requisitos, fechas oficiales.  
    - Devolver siempre un JSON con campos:
      - `intent`  
      - `template_key` (string o null)  
      - `needs_human` (true/false)  
      - `extra_text` (opcional, sin datos sensibles inventados).  

### 4.5 Seguimiento y recordatorios

- Proceso de tarea programada (cron o similar) que:
  - Revise leads en estado `INTERESADO_BROCHURE` o `INTERESADO_COSTOS` sin interacción en X horas.  
  - Envíe un mensaje recordatorio usando una plantilla de seguimiento.  

### 4.6 API de estadísticas

- Endpoints para:
  - Leads por carrera y fecha.  
  - Leads por estado.  
  - Conteo de interacciones automáticas vs derivadas a humano.  

---

## 5. Requisitos no funcionales

### 5.1 Tecnología

- Backend: Node.js + TypeScript (NestJS preferente).  
- WhatsApp: `@whiskeysockets/baileys` o versión estable adecuada. [web:7][web:10]  
- BD: PostgreSQL + Prisma o TypeORM.  
- IA: SDK oficial de OpenAI para chat/completions. [web:18][web:21]  
- Despliegue: Docker + Coolify en VPS. [web:32][web:35][web:41]

### 5.2 Seguridad

- Credenciales y API keys en variables de entorno (.env).  
- No loggear datos sensibles de forma explícita (evitar datos completos de documentos, etc.).  
- Limitar llamadas a OpenAI (rate limit lógico a nivel de backend).

### 5.3 Escalabilidad y mantenibilidad

- Código modular: separar claramente:
  - Módulo de WhatsApp (Baileys).  
  - Módulo de negocio (intents, plantillas).  
  - Módulo IA.  
  - Módulo de BD.  
- Estructura de carpetas clara y documentación básica.

---

## 6. Diseño de alto nivel

### 6.1 Componentes

1. **Servicio WhatsApp (Baileys)**
   - Proceso Node.js que:
     - Se conecta con WhatsApp Web multi-device.  
     - Escucha `messages.upsert`.  
     - Llama al backend vía HTTP (POST `/webhook/whatsapp`).  
     - Envía mensajes de respuesta y adjuntos.

2. **Backend API**
   - Endpoints:
     - `POST /webhook/whatsapp` para procesar mensajes entrantes.  
     - CRUD de `templates`.  
     - CRUD/listado de `leads`.  
     - Endpoints de estadísticas.  

3. **Base de datos**
   - Tablas: `leads`, `interactions`, `templates`, (opcional `campaigns`, `users`).  

4. **Servicio IA**
   - Función para invocar OpenAI con el prompt adecuado.  
   - Recibir mensaje + contexto (FAQs) y devolver JSON con intent/plantilla.

5. **Tareas programadas**
   - Job para recordatorios y seguimiento.

---

## 7. Modelos de datos (borrador)

### 7.1 Tabla `leads`

- `id` (PK)  
- `phone` (string, unique)  
- `full_name` (string, nullable)  
- `career_interest` (string)  
- `source` (string)  
- `status` (enum: `NUEVO`, `INTERESADO_BROCHURE`, `INTERESADO_COSTOS`, `PREINSCRITO`, `INSCRITO`, `DESCARTADO`, `NECESITA_ASESOR`)  
- `created_at` (datetime)  
- `updated_at` (datetime)

### 7.2 Tabla `interactions`

- `id` (PK)  
- `lead_id` (FK a `leads`)  
- `direction` (enum: `INBOUND`, `OUTBOUND`)  
- `message_type` (enum: `TEXT`, `MEDIA`, `TEMPLATE`)  
- `content` (text)  
- `template_key` (string, nullable)  
- `used_ai` (boolean)  
- `created_at` (datetime)

### 7.3 Tabla `templates`

- `id` (PK)  
- `key` (string, unique)  
- `category` (string: `brochure`, `costos`, `requisitos`, `info_general`, `seguimiento`, etc.)  
- `language` (string, ej. `es`)  
- `content` (text)  
- `attachments` (json o string con URLs/rutas)  
- `follow_up_suggested` (boolean)

---

## 8. Requisitos de despliegue (Coolify + VPS)

- El proyecto debe incluir:
  - `Dockerfile` para el backend.  
  - (Opcional) `Dockerfile` específico para el servicio Baileys o un solo contenedor que corra ambos procesos.  
  - `.env.example` con:
    - `PORT`  
    - `DATABASE_URL`  
    - `OPENAI_API_KEY`  
    - `WHATSAPP_SESSION_PATH` u otra configuración de sesión.  

- Debe estar preparado para:
  - Conectarse a una DB PostgreSQL que puede estar:
    - En otro contenedor gestionado por Coolify. [web:43][web:41]  
    - O como servicio externo.  
  - Exponer un puerto HTTP para el backend (ej. 3000).  
  - Ser desplegado en Coolify configurando:
    - Repositorio Git.  
    - Rama.  
    - Variables de entorno.  
    - Comandos de build y start (por ejemplo: `npm install`, `npm run build`, `npm run start:prod`). [web:32][web:35]

---

## 9. Criterios de aceptación

1. Un mensaje entrante a WhatsApp dispara el flujo completo:
   - Se crea/actualiza lead.  
   - Se registra la interacción.  
   - Se responde con una plantilla correcta (brochure/costos/etc.).  

2. El sistema puede responder las FAQs definidas sin usar OpenAI cuando las reglas de keywords sean suficientes.  

3. Cuando el mensaje no se cubre bien por reglas, OpenAI devuelve un JSON con un `template_key` o `needs_human = true`, y el backend responde en consecuencia.  

4. Se pueden consultar leads y estadísticas vía API.  

5. El proyecto se puede levantar en local y desplegar en Coolify con la configuración provista.

---
