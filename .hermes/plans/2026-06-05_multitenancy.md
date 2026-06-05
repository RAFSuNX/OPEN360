# OPEN360 — Multi-Tenancy Refactor Plan

> **Context:** OPEN360 is being built as a SaaS product, not just an internal tool.
> Every organization is a tenant. All data must be fully isolated by `orgId`.
> No tenant can ever see another tenant's data.

**Approach:** Row-level tenancy — add `orgId` to every table, filter all queries by it.
**File rule:** No file exceeds 1000 lines. Split when approaching 800.

---

## Architecture Decisions

### Tenant Resolution
- Path-based: `open360.com/org/[slug]/admin` — simpler deployment, no wildcard DNS
- `slug` is unique per org (e.g. `acme`, `aiavatar`)
- Session stores `orgId` + `orgSlug` after login

### Two Admin Tiers
- **Platform admin** (`isSuperAdmin` on Employee or separate table) — can see all orgs
- **Org admin** (`isAdmin` on Employee, scoped to their org) — manages their own org only

### Public Signup
- `/signup` page — org name + admin email → creates Org + first Employee (isAdmin=true)
- Google OAuth still used for actual login
- After signup, user lands on onboarding within their org context

### Billing (stub for now)
- Add `plan` field to Org: `FREE | PRO`
- Free: up to 10 employees
- Pro: unlimited
- Stripe integration deferred — just model it now

---

## Phase M1 — Database Schema

### Task M1.1: Add Organization model to Prisma schema

**File:** `prisma/schema.prisma`

New model:
```prisma
model Organization {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  plan        OrgPlan  @default(FREE)
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")

  employees        Employee[]
  reviewCycles     ReviewCycle[]
  questionTemplates QuestionTemplate[]
  questions        Question[]
  settings         Setting[]
  allowlist        Allowlist[]
  allowedDomains   AllowedDomain[]

  @@map("organizations")
}

enum OrgPlan {
  FREE
  PRO
}
```

### Task M1.2: Add orgId to all tenant-scoped models

Add to: `Employee`, `ReviewCycle`, `QuestionTemplate`, `Question`, `Setting`, `Allowlist`, `AllowedDomain`

Pattern for each:
```prisma
orgId  String  @map("org_id")
org    Organization @relation(fields: [orgId], references: [id])
```

Add index on orgId for every model:
```prisma
@@index([orgId])
```

### Task M1.3: Migration SQL

File: `prisma/migrations/20260605100000_add_multitenancy/migration.sql`

```sql
-- Create organizations table
CREATE TABLE "organizations" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "plan" TEXT NOT NULL DEFAULT 'FREE',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- Add org_id to all tenant tables (nullable first for migration)
ALTER TABLE "employees" ADD COLUMN "org_id" TEXT;
ALTER TABLE "review_cycles" ADD COLUMN "org_id" TEXT;
ALTER TABLE "question_templates" ADD COLUMN "org_id" TEXT;
ALTER TABLE "questions" ADD COLUMN "org_id" TEXT;
ALTER TABLE "settings" ADD COLUMN "org_id" TEXT;
ALTER TABLE "allowlist" ADD COLUMN "org_id" TEXT;
ALTER TABLE "allowed_domains" ADD COLUMN "org_id" TEXT;

-- Indexes
CREATE INDEX "employees_org_id_idx" ON "employees"("org_id");
CREATE INDEX "review_cycles_org_id_idx" ON "review_cycles"("org_id");
CREATE INDEX "question_templates_org_id_idx" ON "question_templates"("org_id");
CREATE INDEX "questions_org_id_idx" ON "questions"("org_id");
CREATE INDEX "settings_org_id_idx" ON "settings"("org_id");
CREATE INDEX "allowlist_org_id_idx" ON "allowlist"("org_id");
CREATE INDEX "allowed_domains_org_id_idx" ON "allowed_domains"("org_id");

-- FK constraints
ALTER TABLE "employees" ADD CONSTRAINT "employees_org_id_fkey"
  FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "review_cycles" ADD CONSTRAINT "review_cycles_org_id_fkey"
  FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "question_templates" ADD CONSTRAINT "question_templates_org_id_fkey"
  FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "questions" ADD CONSTRAINT "questions_org_id_fkey"
  FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "settings" ADD CONSTRAINT "settings_org_id_fkey"
  FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "allowlist" ADD CONSTRAINT "allowlist_org_id_fkey"
  FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "allowed_domains" ADD CONSTRAINT "allowed_domains_org_id_fkey"
  FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Make settings key unique per org instead of globally
ALTER TABLE "settings" DROP CONSTRAINT "settings_pkey";
ALTER TABLE "settings" ADD CONSTRAINT "settings_org_key_unique" UNIQUE ("org_id", "key");
```

**Commit:** `feat(db): add Organization model and org_id to all tenant tables`

---

## Phase M2 — Routing & Context

### Task M2.1: Org context helper

**New file:** `lib/org-context.ts`

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'

export async function getOrgContext(slug: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect(`/login?next=/org/${slug}`)

  const org = await db.organization.findUnique({
    where: { slug, isActive: true },
  })
  if (!org) redirect('/not-found')

  // Verify user belongs to this org
  const employee = await db.employee.findFirst({
    where: { email: session.user.email!, orgId: org.id, isActive: true },
  })
  if (!employee) redirect(`/login?error=not-member`)

  return { org, employee, session }
}

export async function requireOrgAdmin(slug: string) {
  const ctx = await getOrgContext(slug)
  if (!ctx.employee.isAdmin) redirect(`/org/${slug}/dashboard`)
  return ctx
}
```

### Task M2.2: Migrate routes to org-scoped paths

**Old routes → New routes:**
```
/admin/*              → /org/[slug]/admin/*
/dashboard/*          → /org/[slug]/dashboard/*
/onboarding           → /org/[slug]/onboarding
```

**New file structure:**
```
app/
  org/
    [slug]/
      admin/
        layout.tsx
        page.tsx
        employees/...
        cycles/...
        results/...
        questions/...
        templates/...
        settings/...
      dashboard/
        layout.tsx
        page.tsx
        results/[cycleId]/
        review/[assignmentId]/
      onboarding/
  (public)/
    page.tsx           ← landing page
    signup/page.tsx    ← org signup
    login/page.tsx     ← login
```

**Old routes kept as redirects** to avoid breaking existing installs.

### Task M2.3: Update app/page.tsx root redirect

```typescript
// After login, redirect to user's org
const employee = await db.employee.findFirst({
  where: { email: session.user.email },
  include: { org: { select: { slug: true } } },
})
if (!employee) redirect('/signup')
redirect(`/org/${employee.org.slug}/${employee.isAdmin ? 'admin' : 'dashboard'}`)
```

**Commit:** `feat(routing): org-scoped routes /org/[slug]/*`

---

## Phase M3 — Auth & Session

### Task M3.1: Update NextAuth session to include orgId + orgSlug

**File:** `lib/auth.ts`

Update JWT callback:
```typescript
async jwt({ token }) {
  if (token.email) {
    const employee = await db.employee.findFirst({
      where: { email: token.email as string, isActive: true },
      select: { id: true, isAdmin: true, orgId: true, org: { select: { slug: true } } },
    })
    token.employeeId = employee?.id ?? null
    token.isAdmin = employee?.isAdmin ?? false
    token.orgId = employee?.orgId ?? null
    token.orgSlug = employee?.org?.slug ?? null
  }
  return token
},
```

Update `types/next-auth.d.ts`:
```typescript
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      image?: string
      isAdmin: boolean
      orgId: string
      orgSlug: string
    }
  }
}
```

### Task M3.2: Update signIn callback for multi-tenant allowlist

```typescript
async signIn({ user }) {
  const email = user.email
  if (!email) return false
  // Check if email exists in any org's allowlist
  const allowed = await db.allowlist.findFirst({ where: { email } })
  if (allowed) return true
  // Check domain allowlist across all orgs
  const domain = email.split('@')[1]
  if (domain) {
    const domainAllowed = await db.allowedDomain.findFirst({ where: { domain } })
    if (domainAllowed) return true
  }
  return false
},
```

**Commit:** `feat(auth): add orgId/orgSlug to session, multi-tenant allowlist check`

---

## Phase M4 — Service Layer

### Task M4.1: Update all service functions to require orgId

**Pattern for every service function:**

```typescript
// Before
export async function listEmployees() {
  return db.employee.findMany({ where: { isActive: true }, ... })
}

// After
export async function listEmployees(orgId: string) {
  return db.employee.findMany({ where: { isActive: true, orgId }, ... })
}
```

**Files to update:**
- `lib/services/employees.ts`
- `lib/services/cycles.ts`
- `lib/services/assignments.ts`
- `lib/services/reviews.ts`
- `lib/services/results.ts`
- `lib/services/templates.ts`
- `lib/services/questions.ts`
- `lib/services/notifications.ts`
- `lib/org.ts` (getOrgSettings must be scoped to orgId)

### Task M4.2: Org settings scoped to orgId

**File:** `lib/org.ts`

```typescript
export async function getOrgSettings(orgId: string) {
  const settings = await db.setting.findMany({ where: { orgId } })
  // ... same as before but scoped
}

export async function updateOrgSetting(orgId: string, key: string, value: string) {
  return db.setting.upsert({
    where: { orgId_key: { orgId, key } },
    update: { value },
    create: { orgId, key, value },
  })
}
```

**Commit:** `refactor(services): scope all service functions to orgId`

---

## Phase M5 — Public Signup

### Task M5.1: Landing page

**File:** `app/(public)/page.tsx`

Simple marketing page:
- Hero: "360-degree reviews for your team"
- CTA: "Start free" → `/signup`
- Features list
- Pricing: Free (10 employees) / Pro (unlimited)

### Task M5.2: Org signup page

**File:** `app/(public)/signup/page.tsx`

Form:
1. Org name → auto-generates slug (e.g. "Acme Corp" → `acme-corp`)
2. Your email (must be Google account)
3. Submit → creates Org + adds email to allowlist
4. Redirect to Google OAuth
5. After OAuth → onboarding flow

**API:** `POST /api/signup`
```typescript
// Creates organization + adds first admin to allowlist
// Returns { slug } so client can redirect to /org/[slug]/onboarding
```

### Task M5.3: Slug uniqueness check

**API:** `GET /api/signup/check-slug?slug=acme`
```typescript
// Returns { available: boolean }
// Used for real-time slug validation in signup form
```

**Commit:** `feat(signup): public org signup with slug generation`

---

## Phase M6 — Platform Admin (Super Admin)

### Task M6.1: Super admin model

Add `isSuperAdmin` boolean to `Employee` model (or separate `SuperAdmin` table).
Super admin is set manually via seed script — never exposed in UI.

**File:** `scripts/seed-superadmin.ts`

### Task M6.2: Platform admin routes

**New routes:**
```
app/platform/
  layout.tsx       ← requires isSuperAdmin
  page.tsx         ← org list with stats
  orgs/[id]/
    page.tsx       ← org detail, suspend/activate
```

Stats to show per org:
- Employee count
- Active cycles
- Last activity
- Plan

**Commit:** `feat(platform): super admin org management dashboard`

---

## Phase M7 — API Routes Update

Every API route under `app/api/admin/` must:
1. Extract `orgId` from session: `session.user.orgId`
2. Pass it to all service calls
3. Never trust client-supplied `orgId`

**Pattern:**
```typescript
export async function GET() {
  const session = await requireAdmin()
  const orgId = session.user.orgId   // always from session, never from request
  const employees = await listEmployees(orgId)
  return NextResponse.json(employees)
}
```

---

## Phase M8 — Free Plan Enforcement

**File:** `lib/plan.ts`

```typescript
const FREE_LIMITS = {
  employees: 10,
}

export async function checkEmployeeLimit(orgId: string): Promise<void> {
  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { plan: true, _count: { select: { employees: { where: { isActive: true } } } } },
  })
  if (!org) throw new Error('Org not found')
  if (org.plan === 'FREE' && org._count.employees >= FREE_LIMITS.employees) {
    throw new PlanLimitError(`Free plan is limited to ${FREE_LIMITS.employees} employees. Upgrade to Pro.`)
  }
}

export class PlanLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PlanLimitError'
  }
}
```

Call `checkEmployeeLimit(orgId)` before creating a new employee.

**Commit:** `feat(plans): free plan employee limit enforcement`

---

## Execution Order

| Task | Priority | Blocking |
|---|---|---|
| M1.1 — Schema: Organization model | Critical | Everything |
| M1.2 — Schema: orgId on all tables | Critical | Everything |
| M1.3 — Migration SQL | Critical | DB |
| M2.1 — getOrgContext helper | Critical | Routing |
| M2.2 — Route migration to /org/[slug] | Critical | UI |
| M2.3 — Root redirect | High | UX |
| M3.1 — Session orgId/orgSlug | Critical | Auth |
| M3.2 — Allowlist multi-tenant | High | Auth |
| M4.1 — Service layer orgId | Critical | All queries |
| M4.2 — Org settings scoped | High | Settings |
| M5.1 — Landing page | Medium | Signup |
| M5.2 — Signup page + API | High | Onboarding |
| M5.3 — Slug check API | Medium | Signup UX |
| M6.1 — Super admin model | Medium | Platform admin |
| M6.2 — Platform admin routes | Medium | Platform admin |
| M7 — API routes orgId | Critical | Security |
| M8 — Plan limits | High | Business logic |

---

## File Size Rules

- Max 1000 lines per file. Hard stop.
- If a component approaches 800 lines, split by extracting:
  - Sub-components to `components/[feature]/`
  - Data fetching to `lib/services/`
  - Types to `types/`
- Large admin pages: split into `PageContent.tsx` (client) + `page.tsx` (server, thin)

---

## Security Invariants

1. **Never trust `orgId` from the client.** Always read from `session.user.orgId`.
2. **Every DB query that returns tenant data MUST include `orgId` in the `where` clause.**
3. **`getOrgContext()` validates the session user belongs to the org before proceeding.**
4. A user can only belong to one org at a time (one Employee record per email across all orgs is intentional — prevents cross-org access if someone has the same email).
5. Platform admin routes are protected by `isSuperAdmin`, completely separate from `isAdmin`.
