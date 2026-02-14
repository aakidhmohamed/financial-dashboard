# 🔍 Findings

> Research, discoveries, and constraints uncovered during the project.

## Discovery Answers (2026-02-12)

| Question | Answer |
|---|---|
| North Star | Real-Time Net Worth & Liquidity tracking |
| Integrations | Manual web-form (no external APIs) |
| Source of Truth | Supabase (PostgreSQL) |
| Delivery Payload | Next.js + Tailwind CSS Dashboard |
| Behavioral Rules | 3 revenue categories, balance sheet auto-update, 12-month renewal alerts |

## Research Findings

### Supabase + Next.js Best Practices
- Use `@supabase/ssr` for SSR-compatible client (cookie-based sessions)
- Separate Supabase clients: one for browser, one for server components, one for middleware
- Use Server Components for data fetching, Client Components for interactivity
- Enable Row Level Security (RLS) on all tables
- Generate TypeScript types from Supabase schema for end-to-end type safety

### Database Schema Design
- Use double-entry patterns: every transaction affects an account balance
- Use PostgreSQL triggers for automatic balance recalculation (more reliable than app-level logic)
- Seed default accounts and categories via migration
- Use `numeric(12,2)` for monetary values (not `float`)

### Key Libraries
- `@supabase/supabase-js` — Supabase client
- `@supabase/ssr` — SSR helpers for cookie-based auth/sessions
- `recharts` or `@tremor/react` — Dashboard charts
- `react-hook-form` + `zod` — Form handling with validation
- `date-fns` — Date manipulation (renewal calculations)
- `lucide-react` — Icons
- `shadcn/ui` — Component library (built on Radix + Tailwind)

## Constraints
- No external API integrations needed (manual data entry only)
- Single-user system (no multi-tenancy initially, auth optional)
- Must be mobile-responsive (accessed from laptop or phone)
