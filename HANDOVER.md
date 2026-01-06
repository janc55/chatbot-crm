# Documentación de Entrega - Chatbot UNIOR

## 1. Resumen del Trabajo Realizado
Hemos construido un chatbot de WhatsApp robusto y escalable utilizando **NestJS** y **Baileys**.

### Características Implementadas:
- **Core de Mensajería**: Conexión estable con WhatsApp, reconexión automática y manejo de sesiones.
- **Base de Datos**: PostgreSQL (vía Prisma) para almacenar leads (`Leads`), interacciones (`Interactions`) y plantillas (`Templates`).
- **Gestión de Plantillas**: Sistema híbrido donde las respuestas fijas tienen prioridad (control total) y la IA (OpenAI) actúa solo como clasificador o fallback.
- **Archivos Locales**: Solución para enviar PDFs (Brochures) desde la carpeta local `assets` para evitar errores de descarga y garantizar velocidad.
- **Scheduler Inteligente**: Tarea programada (Cron) que detecta automáticamente usuarios interesados que no han continuado la conversación y les envía seguimiento.
- **Soporte Multi-Carrera**: Estructura lista para manejar múltiples flujos (Ej: Medicina, Derecho).

## 2. Próximos Pasos Sugeridos (Roadmap)
Para llevar el proyecto al siguiente nivel, recomendamos:

1.  **Panel de Administración (Frontend)**:
    - Crear una interfaz web donde puedas editar las respuestas (Templates) y ver los Leads sin tocar código.
    - Botón para subir PDFs directamente desde la web.
2.  **Modo "Agente Humano"**:
    - Implementar un switch en la base de datos para que si un humano interviene, el bot se "silencie" para ese número específico temporalmente.
3.  **Métricas Avanzadas**:
    - Dashboard con gráficos de cuántos interesados por carrera hay cada semana.
4.  **Despliegue en Producción**:
    - Configurar en un VPS (como Coolify) con volúmenes persistentes para la sesión de WhatsApp y la base de datos.

---

## 3. Guía: Agregando Nuevas Carreras

Tienes 9 carreras y quieres control total. Aquí te explico cómo agregar una nueva (ejemplo: **Arquitectura**).

### Paso 1: Preparar el Material
1.  Consigue el PDF del plan de estudios.
2.  Nómbralo `arquitectura.pdf` (sin espacios ni caracteres raros).
3.  Guárdalo en la carpeta `assets/` de tu proyecto.

### Paso 2: Crear las Respuestas (Templates)
Abre el archivo `src/templates/templates.service.ts`.
Busca el array `initialTemplates` y agrega dos objetos nuevos al final (antes del corchete de cierre `];`):

```typescript
{
    key: 'brochure_arquitectura',
    category: 'brochure',
    content: 'La carrera de Arquitectura en UNIOR diseña el futuro. 🏛️ Aquí tienes el *plan de estudios*.',
    attachments: JSON.stringify(['assets/arquitectura.pdf']), // Nombre exacto del archivo
    followUpSuggested: true,
},
{
    key: 'costos_arquitectura',
    category: 'costos',
    content: 'La inversión para Arquitectura es de *$1500 bolivianos* mensuales. 💰',
    attachments: null,
    followUpSuggested: true,
},
```

### Paso 3: Configurar las Reglas
Abre el archivo `src/whatsapp/whatsapp.service.ts`.
Busca la sección `// --- RULE BASED MATCHING ---` dentro del método `handleIntent`.

Agrega un bloque `if` para detectar la intención de arquitectura:

```typescript
// Copia esto debajo del bloque de Derecho
if (lowerText.includes('arquitectura') || lowerText.includes('diseño') || lowerText.includes('construccion')) {
    await this.leadsService.updateInterest(lead.phone, 'ARQUITECTURA'); // Puedes usar string libre o agregarlo al Enum en schema.prisma
    const t = await this.templatesService.findByKey('brochure_arquitectura');
    return t ? { 
        text: t.content, 
        templateKey: t.key, 
        attachments: t.attachments ? JSON.parse(t.attachments) : null, 
        statusUpdate: LeadStatus.INTERESADO_BROCHURE 
    } : null;
}
```

También actualiza la sección de costos un poco más abajo en el mismo archivo:

```typescript
// Dentro verás: if (lead.careerInterest === 'DERECHO' ...
// Agrega:
if (lead.careerInterest === 'ARQUITECTURA' || lowerText.includes('arquitectura')) key = 'costos_arquitectura';
```

### Paso 4: Aplicar Cambios
1.  Reinicia el servidor: `npm run start:dev`.
2.  Al iniciar, el `upsert` que programamos actualizará la base de datos con tus nuevas plantillas automáticamente.

---

## 4. Preguntas Frecuentes

### ¿Puedo usar Emojis e Iconos?
**SÍ, totalmente.**
WhatsApp (y la librería Baileys) soporta emojis nativos.
- Puedes pegarlos directamente en el código: `content: '¡Hola! 👋 Bienvenido 🎓'`
- Se enviarán y verán perfectamente en el teléfono del usuario.

### ¿Cómo doy formato al texto?
WhatsApp usa una sintaxis estilo Markdown simple que puedes incluir en tus textos (`content`):
- **Negrita**: Usa asteriscos. Ej: `*Texto importante*` -> **Texto importante**
- *Cursiva*: Usa guiones bajos. Ej: `_Texto cursiva_` -> *Texto cursiva*
- ~Tachado~: Usa virgulillas. Ej: `~Precio anterior~` -> ~Precio anterior~
- `Monoespaciado`: Usa tres comillas invertidas. Ej: ```Codigo```

**Ejemplo combinado:**
`"El costo es de *$500* _(moneda nacional)_."`

---
**¡Éxito con tu Chatbot Universitario!**
