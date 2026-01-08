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

## Phase 8: Chatbot Behavior Enhancements
- [x] Implement Message Delays (Typing Simulation) <!-- id: 32 -->
    - [x] Backend: Add configurable delay settings (min/max delay, typing speed)
    - [x] Backend: Implement delay logic in message sending
    - [x] Frontend: Settings panel for delay configuration
    - [x] Frontend: Real-time preview of delay behavior
- [x] Advanced Chatbot Settings <!-- id: 33 -->
    - [x] Auto-responses toggle (enable/disable bot)
    - [x] Working hours configuration
    - [x] Custom greeting messages
    - [x] Response templates priority settings
    - [x] AI confidence threshold for fallback responses

## Phase 9: CRM Chat & Advisor Tools
- [ ] Implement Backend Chat Module (Real-time) <!-- id: 37 -->
    - [x] Create QuickReply model in Prisma
    - [x] Implement ChatGateway (WebSockets)
    - [x] Implement ChatController (History, Send, QuickReplies)
    - [x] Integrate with WhatsappService for sending
- [ ] Implement Frontend Chat Interface <!-- id: 38 -->
    - [ ] Add socket.io-client
    - [ ] Build ChatContext
    - [ ] Build Chat Page & Components (MessageList, Input)
- [ ] Implement Advisor Assistance Features <!-- id: 39 -->
    - [ ] Quick Replies (UI & API)
    - [ ] AI Response Suggestions (UI & API)

## Phase 10: Additional Features
- [ ] Implement Notifications and Alerts <!-- id: 34 -->
    - [ ] Backend: Email notification service (Nodemailer)
    - [ ] Backend: In-app alerts for admins (WebSocket/SSE)
    - [ ] Frontend: Notification center in dashboard
    - [ ] Alerts for new leads, handover requests, system errors
- [ ] Implement Reports (without sentiment analysis) <!-- id: 35 -->
    - [ ] Backend: Report generation endpoints (PDF/Excel export)
    - [ ] Backend: Interaction reports (daily/weekly/monthly stats)
    - [ ] Backend: Lead conversion reports
    - [ ] Frontend: Report dashboard with filters and charts
- [ ] Advanced Personalization - Dynamic Templates <!-- id: 36 -->
    - [ ] Backend: Template variable system ({{name}}, {{career}}, etc.)
    - [ ] Backend: Dynamic content insertion in responses
    - [ ] Frontend: Template editor with variable placeholders
    - [ ] Database: Update template schema for dynamic fields
