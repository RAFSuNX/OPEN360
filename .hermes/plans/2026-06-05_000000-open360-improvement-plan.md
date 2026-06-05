# OPEN360 — Full Improvement Plan

> **For Hermes:** Execute one phase at a time, task by task. Commit after each task.

**Goal:** Transform OPEN360 from a functional MVP into a production-ready, usable 360-degree review platform.

**Architecture:** Next.js 16 App Router, PostgreSQL + Prisma, NextAuth (Google OAuth), Tailwind CSS v4, Cursor design system (DESIGN.md).

**Design system:** Warm cream canvas `#f7f7f4`, Cursor Orange `#f54e00` accent, hairline-only depth (no drop shadows), JetBrains Mono for code/labels.

**Rule:** Never break the design system. All inline styles must use CSS variables from DESIGN.md.

---

## PHASE 1 — Documentation & Setup (No Code Risk)

### Task 1.1: Rewrite README.md
**File:** `README.md`
**What:** Replace default Next.js README with real project documentation.
**Include:**
- What OPEN360 is (one paragraph)
- Tech stack list
- Prerequisites (Node 20+, PostgreSQL, Google OAuth app)
- Full `.env` variable reference with descriptions for every key
- Local dev setup steps (clone → install → db setup → seed → run)
- Docker/k8s deployment overview
- How to create the first admin account (`npm run bootstrap:admin`)

**Commit:** `docs: rewrite README with full setup guide`

---

### Task 1.2: Improve .env.example
**File:** `.env.example`
**What:** Add inline comments explaining every variable.

```env
# PostgreSQL connection string
DATABASE_URL=postgresql://user:password@localhost:5432/open360

# NextAuth — generate with: openssl rand -base64 32
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# Google OAuth — create at console.cloud.google.com
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# SMTP for email notifications (Gmail example shown)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your@gmail.com

# AES-256 encryption key for review responses — generate with: openssl rand -hex 32
ENCRYPTION_KEY=

# Secret for cron job endpoints — generate with: openssl rand -hex 16
CRON_SECRET=

# Email of first admin user (must match Google account)
FIRST_ADMIN_EMAIL=
```

**Commit:** `docs: add comments to .env.example`

---

## PHASE 2 — Critical Bug Fixes & Auth Improvements

### Task 2.1: Domain-based Allowlist
**Problem:** Admin must add every email manually. Entire `@company.com` domain cannot be allowed.
**Files:**
- `prisma/schema.prisma` — add `AllowedDomain` model
- `prisma/migrations/` — new migration
- `lib/auth.ts` — update `signIn` callback to check domain
- `app/api/admin/allowlist/route.ts` — new API for managing domains
- `app/admin/settings/SettingsForm.tsx` — add domain allowlist UI section

**Schema addition:**
```prisma
model AllowedDomain {
  id        String   @id @default(uuid())
  domain    String   @unique
  addedAt   DateTime @default(now()) @map("added_at")
  @@map("allowed_domains")
}
```

**Auth logic update in `lib/auth.ts` signIn callback:**
```typescript
const email = user.email
if (!email) return false
// Check allowlist first
const allowed = await db.allowlist.findUnique({ where: { email } })
if (allowed) return true
// Check domain allowlist
const domain = email.split('@')[1]
const domainAllowed = await db.allowedDomain.findUnique({ where: { domain } })
if (domainAllowed) return true
return false
```

**Commit:** `feat: add domain-based allowlist for org-wide access`

---

### Task 2.2: Fix Employee Dashboard — Proper Home Page
**Problem:** `/dashboard` is just a list of pending reviews. No overview, no history, no status.
**Files:**
- `app/dashboard/page.tsx` — new proper dashboard
- `app/dashboard/layout.tsx` — new layout with nav (mirrors admin layout but for employees)
- `lib/services/reviews.ts` — add `getCompletedReviews()` function

**Dashboard sections:**
1. Greeting with employee name
2. Pending reviews card (existing, but styled properly)
3. My review status — how many people have reviewed me in active cycle
4. Past results — list of closed cycles with link to results

**Layout nav items:**
```typescript
const navItems = [
  { href: '/dashboard', label: 'Home', exact: true },
  { href: '/dashboard/results', label: 'My Results' },
  { href: '/dashboard/profile', label: 'Profile' },
]
```

**Commit:** `feat: build proper employee dashboard with overview and history`

---

### Task 2.3: Employee Results History Page
**Problem:** Employees can only see results for the current cycle via admin. No self-service history.
**Files:**
- `app/dashboard/results/page.tsx` — list all closed cycles where employee has results
- `app/dashboard/results/[cycleId]/page.tsx` — detailed results for one cycle
- `app/api/dashboard/results/route.ts` — API to fetch own results
- `app/api/dashboard/results/[cycleId]/route.ts` — API for specific cycle results

**Logic:** Reuse `buildResults()` from `lib/services/results.ts` with `forAdmin=false` (anonymity respected).

**Commit:** `feat: add employee self-service results history`

---

## PHASE 3 — Admin UX Improvements

### Task 3.1: Bulk Auto-Assign by Manager Hierarchy
**Problem:** Admin manually assigns every reviewer. Unscalable.
**Files:**
- `app/api/admin/assignments/bulk/route.ts` — new endpoint
- `app/admin/cycles/[id]/CycleDetail.tsx` — add "Auto-assign" button
- `lib/services/assignments.ts` — add `autoAssignByCycle()` function

**Auto-assign logic:**
```typescript
// For each employee in cycle:
// - Add SELF assignment (employee reviews themselves)
// - Add MANAGER assignment (their manager reviews them)
// - Add DIRECT_REPORT assignments (their direct reports review them)
// - Add PEER assignments (peers in same department, up to N peers)
```

**UI:** Button in cycle detail: "Auto-assign by hierarchy" with confirmation modal showing preview count.

**Commit:** `feat: auto-assign reviewers by org hierarchy`

---

### Task 3.2: Admin Results Dashboard — Summary View
**Problem:** Admin can only view results per employee. No cycle-level summary.
**Files:**
- `app/admin/results/page.tsx` — cycle list with completion stats
- `app/admin/results/[cycleId]/page.tsx` — cycle overview (completion rate per employee)
- `lib/services/results.ts` — add `getCycleSummary()` function

**Stats to show per cycle:**
- Total assignments vs submitted (completion %)
- Per employee: how many reviews submitted / total assigned
- Color coding: green >80%, yellow 50-80%, red <50%

**Commit:** `feat: add admin cycle results summary dashboard`

---

### Task 3.3: Scheduled Email Reminders
**Problem:** Email reminders exist as an API but nothing triggers them automatically.
**Files:**
- `app/api/cron/reminders/route.ts` — new cron endpoint
- `next.config.ts` — verify no changes needed
- Deployment docs — note to set up cron job (Vercel cron or external)

**Endpoint logic:**
```typescript
// GET /api/cron/reminders?secret=CRON_SECRET
// Find all ACTIVE cycles where endDate is within 3 days
// Find all unsubmitted assignments in those cycles
// Send reminder email to each reviewer
// Rate-limit: max 1 reminder per reviewer per day
```

**Commit:** `feat: add automated reminder cron endpoint`

---

## PHASE 4 — UI / UX Polish

### Task 4.1: Employee Profile Page
**Problem:** Employees cannot see or update their own profile info.
**Files:**
- `app/dashboard/profile/page.tsx`
- `app/api/dashboard/profile/route.ts`

**What to show:** Name, email, department, role, manager name (read-only except name if allowed).

**Commit:** `feat: add employee profile page`

---

### Task 4.2: Results Visualization — Charts
**Problem:** Results are just numbers and text. No visual representation.
**Files:**
- `components/dashboard/ResultsChart.tsx` — rating bar charts per category
- `app/dashboard/results/[cycleId]/page.tsx` — integrate charts
- `app/admin/results/[cycleId]/[employeeId]/page.tsx` — integrate charts

**Implementation:** Use pure CSS/SVG bars (no chart library dependency). Keep it simple:
- Rating questions: horizontal bar chart showing average vs max scale
- Color: `var(--primary)` for bars, `var(--hairline)` for track

**Commit:** `feat: add visual rating charts to results pages`

---

### Task 4.3: Mobile Responsiveness Audit
**Problem:** Layout uses inline styles with fixed widths. Likely breaks on mobile.
**Files:** All layout files — audit and fix.
**Key fixes:**
- Nav wrapping on small screens
- Table overflow handling for employee/cycle tables
- Review form single-column on mobile
- Admin dashboard stat cards stack vertically on mobile

**Commit:** `fix: improve mobile responsiveness across all pages`

---

### Task 4.4: Proper README for Open Source
**File:** `README.md`
**What:** Add badges, screenshots placeholder, contributing guide, license section.
**Also:** Add GitHub topics to repo: `hr-tools`, `360-review`, `nextjs`, `open-source`, `employee-feedback`

**Commit:** `docs: polish README for open source release`

---

## PHASE 5 — Code Quality & Security

### Task 5.1: API Route Input Validation
**Problem:** API routes do minimal input validation — potential for bad data or injection.
**Files:** All `app/api/**/*.ts` routes
**What:** Add `zod` schema validation to every POST/PUT endpoint.

**Install:** `npm install zod`

**Pattern:**
```typescript
import { z } from 'zod'
const schema = z.object({ name: z.string().min(1).max(100) })
const parsed = schema.safeParse(await req.json())
if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 })
```

**Commit:** `security: add zod input validation to all API routes`

---

### Task 5.2: Rate Limiting on Auth Endpoints
**Problem:** No rate limiting on login or API endpoints.
**Files:** `middleware.ts` (create if not exists)
**What:** Simple in-memory rate limiting for `/api/auth/**` routes.
**Note:** For production, use Redis-backed rate limiting.

**Commit:** `security: add basic rate limiting to auth endpoints`

---

### Task 5.3: Audit Log
**Problem:** No record of admin actions.
**Files:**
- `prisma/schema.prisma` — add `AuditLog` model
- `lib/audit.ts` — helper to write audit entries
- `app/admin/settings/page.tsx` — add audit log viewer

**Schema:**
```prisma
model AuditLog {
  id         String   @id @default(uuid())
  actorEmail String   @map("actor_email")
  action     String
  target     String?
  metadata   String?
  createdAt  DateTime @default(now()) @map("created_at")
  @@map("audit_logs")
}
```

**Commit:** `feat: add audit log for admin actions`

---

### Task 5.4: Expand Test Coverage
**Problem:** Only 3 test files. No tests for critical paths.
**Files:**
- `__tests__/lib/results.test.ts` — test anonymity threshold, encryption/decryption in results
- `__tests__/lib/auth.test.ts` — test allowlist + domain allowlist logic
- `__tests__/api/assignments.test.ts` — test auto-assign logic

**Commit:** `test: expand test coverage for results, auth, and assignments`

---

## PHASE 6 — Open Source Readiness

### Task 6.1: Contributing Guide
**File:** `CONTRIBUTING.md`
**Include:** Dev setup, code style, PR process, issue templates.

### Task 6.2: GitHub Issue Templates
**Files:**
- `.github/ISSUE_TEMPLATE/bug_report.md`
- `.github/ISSUE_TEMPLATE/feature_request.md`

### Task 6.3: License
**File:** `LICENSE`
**What:** Add MIT license file.

**Commit:** `chore: add contributing guide, issue templates, and license`

---

## Priority Order for Execution

| Phase | Priority | Impact | Risk |
|---|---|---|---|
| Phase 1 — Docs | Start here | Medium | Zero |
| Phase 2.2 — Employee Dashboard | High | High | Low |
| Phase 2.3 — Results History | High | High | Low |
| Phase 2.1 — Domain Allowlist | High | High | Medium |
| Phase 3.1 — Auto-assign | High | High | Medium |
| Phase 3.2 — Admin Results Summary | Medium | High | Low |
| Phase 3.3 — Email Reminders | Medium | Medium | Low |
| Phase 4.1 — Profile Page | Medium | Medium | Low |
| Phase 4.2 — Charts | Medium | Medium | Low |
| Phase 4.3 — Mobile | Medium | Medium | Low |
| Phase 5.1 — Validation | High | High | Low |
| Phase 5.3 — Audit Log | Medium | Medium | Medium |
| Phase 5.4 — Tests | Medium | High | Low |
| Phase 6 — OSS Readiness | Low | Medium | Zero |

---

## Notes

- Always read `node_modules/next/dist/docs/` before writing Next.js code (per AGENTS.md)
- Design system is in `DESIGN.md` — use CSS variables, no hardcoded hex values in JSX
- Encryption key is used for all review responses — never log decrypted answers
- `buildResults()` in `lib/services/results.ts` handles anonymity — never bypass it
- The `forAdmin` flag in `buildResults()` skips anonymity threshold — use carefully
