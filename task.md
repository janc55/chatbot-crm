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
- [x] Implement Backend Chat Module (Real-time) <!-- id: 37 -->
    - [x] Create QuickReply model in Prisma
    - [x] Implement ChatGateway (WebSockets)
    - [x] Implement ChatController (History, Send, QuickReplies)
    - [x] Integrate with WhatsappService for sending
- [x] Implement Frontend Chat Interface <!-- id: 38 -->
    - [x] Add socket.io-client
    - [x] Build ChatContext
    - [x] Build Chat Page & Components (MessageList, Input)
- [x] Implement Advisor Assistance Features <!-- id: 39 -->
    - [x] Quick Replies (UI & API)
    - [x] AI Response Suggestions (UI & API)

## Phase 11: Email Integration with Resend & React Email
- [x] Implement Resend Email Service <!-- id: 40 -->
    - [x] Install Resend SDK in backend (`@nestjs/config`, `resend`)
    - [x] Configure environment variables (`RESEND_API_KEY`, `FRONTEND_URL`)
    - [x] Create MailModule (`src/mail/mail.module.ts`)
    - [x] Implement MailService (`src/mail/mail.service.ts`)
    - [x] Add password reset email functionality (Spanish)
    - [x] Add welcome email functionality (sent on user creation)
    - [x] Add support email functionality
    - [x] Configure domain verification (`netti.lat`)
    - [x] Change sender to `no-reply@netti.lat`
- [x] Implement React Email Templates <!-- id: 41 -->
    - [x] Install React Email in frontend (`client/`)
    - [x] Create email templates directory (`client/src/emails/`)
    - [x] Implement PasswordResetEmail component with professional design
    - [x] Configure TypeScript for JSX in backend (`tsconfig.json`)
    - [x] Create render utilities (`client/src/emails/render.ts`, `src/emails/render.ts`)
- [x] Implement Password Recovery Flow <!-- id: 42 -->
    - [x] Backend: Add password reset endpoints in AuthController
    - [x] Backend: Implement JWT token generation for password reset
    - [x] Backend: Add password update functionality in UsersService
    - [x] Frontend: Create ForgotPasswordModal component
    - [x] Frontend: Create ResetPassword page component
    - [x] Frontend: Add routing for password reset (`/reset-password`)
    - [x] Frontend: Integrate modal in Login component
- [x] Email Template Features <!-- id: 43 -->
    - [x] Professional HTML design with Tailwind CSS
    - [x] Responsive layout for all devices
    - [x] Dark mode support
    - [x] Custom branding (Nettidev colors and logo)
    - [x] Security information and expiry warnings
    - [x] Fallback text links for email clients
    - [x] Company footer with contact information

### Implementation Details

#### Files Created:
- `src/mail/mail.module.ts` - NestJS module for email services
- `src/mail/mail.service.ts` - Main email service with Resend integration
- `src/emails/PasswordResetEmail.tsx` - React Email component for password reset
- `src/emails/WelcomeEmail.tsx` - React Email component for user welcome
- `src/emails/render.ts` - Email rendering utilities
- `src/emails/index.ts` - Email module exports
- `client/src/emails/PasswordResetEmail.tsx` - Frontend email template (development)
- `client/src/emails/render.ts` - Frontend rendering utilities
- `client/src/emails/index.ts` - Frontend email exports
- `client/src/ForgotPasswordModal.tsx` - Modal for password recovery
- `client/src/ResetPassword.tsx` - Page for password reset

#### Files Modified:
- `src/app.module.ts` - Added MailModule import and configuration
- `src/auth/auth.module.ts` - Added MailModule dependency
- `src/auth/auth.service.ts` - Added password reset methods
- `src/auth/auth.controller.ts` - Added password reset endpoints
- `src/users/users.service.ts` - Added password update method and welcome email on user creation
- `src/users/users.module.ts` - Added MailModule dependency
- `client/src/main.tsx` - Added reset password route
- `client/src/Login.tsx` - Added forgot password modal integration
- `tsconfig.json` - Added JSX support for React Email
- `test/app.e2e-spec.ts` - Fixed supertest import issue
- `.env` - Added FRONTEND_URL and RESEND_API_KEY

#### Libraries Added:
- Backend: `resend`, `@react-email/components`, `@react-email/render`
- Frontend: `react-email`

#### Environment Variables:
- `RESEND_API_KEY=re_7Rg5vKPy_D9b9LufuxwUv3QNze2KPGmxx`
- `FRONTEND_URL=http://localhost:5173`

#### API Endpoints Added:
- `POST /auth/request-password-reset` - Request password reset email
- `POST /auth/reset-password` - Reset password with token
- `POST /users` - Create user (automatically sends welcome email)

#### Email Features:
- Professional templates with Nettidev branding (in Spanish)
- Welcome email sent automatically on user creation
- Password reset email with secure token handling
- Responsive design (mobile + desktop)
- Dark mode support
- Security warnings and expiry information (1 hour expiration for password reset)
- Feature highlights in welcome email
- Fallback links for email clients
- Company footer with generic contact information

#### Security Features:
- JWT tokens with 1-hour expiration
- Secure password hashing with bcrypt
- Email validation before sending
- Token verification before password reset

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
