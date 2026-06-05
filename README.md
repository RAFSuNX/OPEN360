# OPEN360

Open-source 360-degree employee review system. Built for teams that want structured, anonymous peer feedback without locking into expensive HR software.

---

## What it does

- **Review cycles** — create named cycles (e.g. "Q2 2026"), set start/end dates, manage status (Draft → Active → Closed)
- **360-degree feedback** — self, manager, peer, and direct report reviews in one cycle
- **Anonymous responses** — all review answers are encrypted at rest; peer/direct report results are hidden until anonymity threshold is met
- **Question templates** — reusable question sets (rating scale + open text) across cycles
- **Email notifications** — reminders to reviewers, completion alerts to admins
- **Results** — per-employee results broken down by relationship type, with anonymity protection
- **Admin panel** — manage employees, cycles, assignments, templates, org settings
- **Employee dashboard** — see pending reviews, submit feedback, view own results

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| Auth | NextAuth v4 (Google OAuth) |
| Email | Nodemailer (SMTP) |
| Styling | Tailwind CSS v4 + Cursor design system |
| PDF Export | jsPDF |
| Testing | Jest + Testing Library |
| Deployment | Docker / Kubernetes |

---

## Prerequisites

- Node.js 20+
- PostgreSQL 14+
- A Google Cloud project with OAuth 2.0 credentials
- An SMTP server (Gmail App Password works)

---

## Local Development Setup

### 1. Clone the repo

```bash
git clone https://github.com/RAFSuNX/OPEN360.git
cd OPEN360
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in every value. See the [Environment Variables](#environment-variables) section below.

### 4. Set up the database

```bash
# Run migrations
npx prisma migrate dev

# (Optional) Seed with sample data
npm run db:seed
```

### 5. Create your first admin account

```bash
npm run bootstrap:admin
```

This adds `FIRST_ADMIN_EMAIL` to the allowlist and marks it as admin in the database.

### 6. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with your Google account.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string. Format: `postgresql://user:pass@host:5432/dbname` |
| `NEXTAUTH_SECRET` | Yes | Random secret for NextAuth session encryption. Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | Full URL of the app. `http://localhost:3000` for local dev, your domain in production |
| `GOOGLE_CLIENT_ID` | Yes | OAuth 2.0 Client ID from [Google Cloud Console](https://console.cloud.google.com) |
| `GOOGLE_CLIENT_SECRET` | Yes | OAuth 2.0 Client Secret from Google Cloud Console |
| `SMTP_HOST` | Yes | SMTP server hostname. e.g. `smtp.gmail.com` |
| `SMTP_PORT` | Yes | SMTP port. `587` for STARTTLS, `465` for SSL |
| `SMTP_USER` | Yes | SMTP login username (usually your email address) |
| `SMTP_PASS` | Yes | SMTP password or App Password |
| `SMTP_FROM` | Yes | From address for outgoing emails. e.g. `reviews@yourcompany.com` |
| `ENCRYPTION_KEY` | Yes | AES-256 key for encrypting review responses. Generate: `openssl rand -hex 32` |
| `CRON_SECRET` | Yes | Secret token to protect cron job endpoints. Generate: `openssl rand -hex 16` |
| `FIRST_ADMIN_EMAIL` | Yes | Email of the first admin user. Must match their Google account email |

### Setting up Google OAuth

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use an existing one)
3. Enable the **Google+ API** (or People API)
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (local)
   - `https://yourdomain.com/api/auth/callback/google` (production)
7. Copy the Client ID and Client Secret into your `.env.local`

---

## Access Control

OPEN360 uses an email allowlist. Only emails in the `allowlist` table can sign in.

- The first admin is seeded via `npm run bootstrap:admin` using `FIRST_ADMIN_EMAIL`
- Admins can add more emails via the Admin → Settings panel
- Domain-based allowlist lets you allow an entire `@company.com` domain at once

---

## Deployment

### Docker

```bash
# Build the image
docker build -t open360 .

# Run with environment variables
docker run -p 3000:3000 --env-file .env open360
```

### Kubernetes

Kubernetes manifests are in the `k8s/` directory:

```bash
kubectl apply -k k8s/
```

Set your environment variables as a Kubernetes Secret and reference them in the deployment.

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/RAFSuNX/OPEN360)

Add all environment variables in the Vercel dashboard under Project Settings → Environment Variables.

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Jest tests |
| `npm run db:seed` | Seed database with sample data |
| `npm run bootstrap:admin` | Create first admin account |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines, code style, and the PR process.

---

## License

MIT — see [LICENSE](LICENSE) for details.
