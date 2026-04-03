# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### HealthPulse - Health Monitoring App (`artifacts/health-monitor`)
- **Type**: Expo (React Native) mobile app
- **Preview path**: `/`
- **Features**:
  - User authentication (email/password via AsyncStorage)
  - User health profile (age, height, weight, occupation, blood type, conditions, medications, goals)
  - Daily health check-ups (mood, energy, sleep, water intake, symptoms, notes)
  - Health history with expandable entries
  - AI health tips powered by Gemini (via API server)
  - Admin dashboard to view all users and their health data
  - First user created becomes admin automatically
- **Key files**:
  - `lib/firebase.ts` — Custom auth system using AsyncStorage
  - `lib/storage.ts` — Health data persistence with AsyncStorage
  - `lib/gemini.ts` — Gemini API client (calls API server)
  - `context/AuthContext.tsx` — Auth state management
  - `context/HealthContext.tsx` — Health data state management
  - `constants/colors.ts` — Teal/emerald health-themed color palette
  - `app/(auth)/` — Login and register screens
  - `app/(app)/` — Main app screens (home, checkup, history, tips, profile, admin)

### API Server (`artifacts/api-server`)
- **Type**: Express.js backend
- **Routes**:
  - `GET /api/healthz` — health check
  - `POST /api/health-tips` — Generate AI health tips via Gemini

## Environment Variables
- `AI_INTEGRATIONS_GEMINI_BASE_URL` — Gemini API base URL (auto-provisioned)
- `AI_INTEGRATIONS_GEMINI_API_KEY` — Gemini API key (auto-provisioned)
- `SESSION_SECRET` — Server session secret
