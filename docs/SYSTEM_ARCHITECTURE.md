# SYSTEM ARCHITECTURE

## 1. Executive Summary
Campus Connect is a modern, real-time, highly scalable web application designed for university students. It combines the functionality of social networking, messaging, academic collaboration, and professional networking into a single unified platform. 

This document serves as the single source of truth for the system's architecture, database design, and security models as of the Phase 8 Production Certification.

## 2. High-Level Architecture
The system follows a serverless, decoupled architecture utilizing the Jamstack paradigm:

- **Frontend / Application Framework:** Next.js 14 (App Router)
- **UI / Styling:** React 18, Tailwind CSS 3, Radix UI primitives, custom Meta-inspired design system.
- **Backend / API:** Next.js Route Handlers (Serverless functions) deployed on Vercel.
- **Database & Auth:** Supabase (PostgreSQL 15), Supabase Auth (PKCE flow).
- **Caching & Rate Limiting:** Upstash Redis.
- **Storage:** Supabase Storage (S3-compatible) for user uploads, avatars, and attachments.
- **AI & Search:** OpenAI text-embedding models combined with pgvector for semantic search and recommendation engines.

## 3. Database Architecture (Supabase / PostgreSQL 15)
The platform utilizes 44 canonical database tables. 

### Core Schemas
- **Users & Profiles:** Extends Supabase auth.users with custom profiles, skills, and portfolio tables.
- **Social Graph:** ollowers, connections tables to track bidirectional and unidirectional relationships.
- **Content:** posts, comments, eactions, eposts, polls, poll_votes.
- **Messaging (Realtime):** conversations, messages, conversation_participants.
- **Academic & Jobs:** esearch_papers, jobs, pplications, questions, nswers.
- **Notifications:** 
otifications, push_subscriptions.
- **Gamification:** eputation_scores, adges, leaderboards.

### Security: Row Level Security (RLS)
The database achieves **100% RLS coverage** across all 44 tables. 
- No application-level data fetching bypasses RLS. 
- Policies are strictly bound to uth.uid() ensuring tenant isolation.
- Example: Users can only delete their own posts, read public posts, and insert messages into conversations they are participants of.

## 4. Real-time & Communication Subsystems
- **Supabase Realtime:** Utilized for live feed updates, typing indicators, and instant direct messaging via PostgreSQL logical replication (WAL).
- **WebRTC:** Integrated for peer-to-peer browser-based audio and video calls. Signaling is handled via Supabase Realtime presence and broadcast channels.
- **Push Notifications:** Implemented via standard Web Push protocols (VAPID). Subscriptions are securely stored in the DB and triggered via edge functions.

## 5. Monetization & Payments
- **Payment Provider:** Stripe.
- **Abstraction Layer:** The system uses a generic payment interface allowing future integration of Razorpay or PayPal.
- **Webhook Handling:** Stripe webhooks are processed securely via Next.js API routes with idempotency checks to prevent double-billing.

## 6. Observability & Telemetry
- **Error Tracking:** Sentry is integrated at the Edge, Server, and Client levels.
- **Analytics:** PostHog handles product telemetry, session recording, and feature flagging.
- **Logging:** Structured JSON logging implemented across all serverless API routes.

## 7. CI/CD & Deployment Topology
- **Source Control:** GitHub.
- **CI Pipeline:** GitHub Actions automatically runs TypeScript type-checking, ESLint, Jest unit/integration tests, and Playwright E2E tests on every PR.
- **Deployment:** Vercel automatically deploys the main branch to Production. Preview environments are generated for every PR.
