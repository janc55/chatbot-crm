# Task List: WhatsApp Chatbot Universitario

## Phase 1: Project Setup & Database
- [x] Initialize NestJS Project Structure <!-- id: 1 -->
- [x] Configure Environment Variables (.env, .env.example) <!-- id: 2 -->
- [x] Define Prisma Schema (Leads, Interactions, Templates) <!-- id: 3 -->
- [x] Run Prisma Migrations & Generate Client <!-- id: 4 -->

## Phase 2: Core Modules & Business Logic
- [x] Implement PrismaModule (Database Connection) <!-- id: 5 -->
- [x] Implement OpenAIModule (Service & Classifier) <!-- id: 6 -->
- [x] Implement TemplatesModule (CRUD & Seed) <!-- id: 7 -->
- [x] Implement LeadsModule (Management & Stats) <!-- id: 8 -->
- [x] Implement InteractionsModule (Logging) <!-- id: 9 -->

## Phase 3: WhatsApp Integration (Baileys)
- [x] Implement WhatsappModule (Baileys Connection) <!-- id: 10 -->
- [x] Implement Message Listener & Normalization <!-- id: 11 -->
- [x] Implement Webhook/Logic Handler (Rules + AI) <!-- id: 12 -->
- [x] Implement Response Sender (Text & Media) <!-- id: 13 -->

## Phase 4: Scheduler & Polish
- [x] Implement Follow-up Scheduler (Cron) <!-- id: 14 -->
- [x] Add API Documentation (Swagger) <!-- id: 15 -->
- [x] Create Dockerfile & docker-compose.yml <!-- id: 16 -->
- [x] Create README.md with Deployment Instructions <!-- id: 17 -->

## Phase 5: Verification
- [x] Verify Build & Startup <!-- id: 18 -->
- [x] Verify Database Connectivity <!-- id: 19 -->
- [x] Manual walkthrough of the flow <!-- id: 20 -->
- [x] Refine Scheduler Logic <!-- id: 21 -->
- [x] Add 'Derecho' Career <!-- id: 22 -->

## Phase 6: Roadmap (Future improvements)
## Phase 6: Advanced Features & Optimization
- [x] Implement Basic Admin Panel (CRM) <!-- id: 23 -->
- [x] Implement "Human Agent" Mode (Handover) <!-- id: 24 -->
    - [x] Backend: Add isHandoverActive flag to Leads
    - [x] Logic: Bypass Bot if Handover is active
    - [x] Frontend: Toggle switch in Lead Detail
- [x] Implement Advanced Analytics (Reports) <!-- id: 25 -->
    - [x] Backend: Endpoints for daily/weekly interaction counts
    - [x] Frontend: Charts (Recharts/Chart.js) in Dashboard
- [x] Optimize AI Context with RAG (Embeddings) <!-- id: 27 -->
    - [x] Add 'embedding' field to Templates
    - [x] Implement Vector Search (Local or PGVector)
    - [x] Update OpenAI Service to use relevant context only
- [x] Configure Production Deployment (VPS/Coolify) <!-- id: 26 -->

## Phase 7: Testing Strategy
- [x] Setup Jest Environment (Done by default in NestJS) <!-- id: 28 -->
- [x] Unit Tests: Services <!-- id: 29 -->
    - [x] TemplatesService (Mock Prisma & OpenAI)
    - [x] LeadsService (Mock Prisma)
    - [x] OpenAI Service (Mock API calls)
- [x] E2E Tests: Flows <!-- id: 30 -->
    - [x] Leads Controller ( API Endpoints)
    - [x] WhatsApp processing flow (Mock Baileys)
- [x] Load Testing (Optional) <!-- id: 31 -->
    - [x] Script `scripts/load-test.js` created and verified.
