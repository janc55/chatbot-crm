-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NUEVO', 'INTERESADO_BROCHURE', 'INTERESADO_COSTOS', 'PREINSCRITO', 'INSCRITO', 'DESCARTADO', 'NECESITA_ASESOR', 'PREINSCRIPCION_EN_PROCESO');

-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'MEDIA', 'TEMPLATE');

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "full_name" TEXT,
    "career_interest" TEXT,
    "source" TEXT NOT NULL DEFAULT 'unknown',
    "status" "LeadStatus" NOT NULL DEFAULT 'NUEVO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interactions" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "direction" "Direction" NOT NULL,
    "message_type" "MessageType" NOT NULL,
    "content" TEXT NOT NULL,
    "template_key" TEXT,
    "used_ai" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "templates" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'es',
    "content" TEXT NOT NULL,
    "attachments" TEXT,
    "follow_up_suggested" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leads_phone_key" ON "leads"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "templates_key_key" ON "templates"("key");

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
