# Contributing to OPEN360

Thank you for your interest in contributing. Here is everything you need to get started.

## Development Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- A Google OAuth app (for login)

### Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/RAFSuNX/OPEN360.git
cd OPEN360

# 2. Install dependencies
npm install

# 3. Copy env and fill in values
cp .env.example .env

# 4. Run database migrations
npx prisma migrate dev

# 5. Seed default questions (optional)
npx prisma db seed

# 6. Start the dev server
npm run dev
```

The app will be at http://localhost:3000.

### Creating the First Admin

After signing in with your Google account, run:

```bash
FIRST_ADMIN_EMAIL=your@email.com npx tsx scripts/seed-admin.ts
```

## Code Style

- TypeScript everywhere — no `any` unless absolutely necessary
- Files must not exceed 1000 lines — split into components if they do
- Design system: use CSS variables from `DESIGN.md`, never hardcode hex values in JSX
- All API routes must read `orgId` from `session.user.orgId` — never trust client input
- Use Zod schemas for all API input validation

## Pull Request Process

1. Fork the repository
2. Create a branch: `git checkout -b feat/your-feature`
3. Make your changes and test locally
4. Ensure TypeScript compiles: `npx tsc --noEmit`
5. Commit with a conventional message:
   - `feat: add something new`
   - `fix: fix a bug`
   - `docs: update documentation`
   - `chore: dependency update`
6. Open a PR with a clear description of what you changed and why

## Database Changes

- Add a new migration file under `prisma/migrations/`
- Never modify existing migration files
- Update `prisma/schema.prisma` with the model changes
- All tenant tables must have `orgId` scoped queries

## Reporting Issues

Use the GitHub issue templates for bug reports and feature requests. Include:
- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, Node version, browser)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
