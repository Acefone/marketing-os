# Marketing Agent OS — Setup Guide

This guide covers local development setup, credentials configuration, and user management.

---

## Prerequisites

- **Node.js v20+** — [nodejs.org](https://nodejs.org)
- **Docker Desktop** — [docker.com/get-started](https://www.docker.com/get-started)
- **Git**
- An **Anthropic API key** — [console.anthropic.com](https://console.anthropic.com)
- A **Notion integration token + database ID** (optional — system works without it)

---

## Step 1 — Clone the repository

```bash
git clone <your-repo-url>
cd marketing-os
```

---

## Step 2 — Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in the required values:

### Required

| Variable | What it is | Where to get it |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude API key | console.anthropic.com → API Keys |
| `JWT_SECRET` | Random secret for signing tokens | Generate one — see below |
| `POSTGRES_PASSWORD` | Password for the local DB | Any strong password |

**Generate a JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output and paste it as `JWT_SECRET=` in your `.env`.

### Optional (Notion output mirroring)

| Variable | What it is | Where to get it |
|---|---|---|
| `NOTION_TOKEN` | Notion integration secret | notion.so/my-integrations → New integration |
| `NOTION_DATABASE_ID` | ID of your Notion outputs database | Copy from the Notion database URL |

If you leave these blank, agent outputs still save to PostgreSQL — only the Notion mirror is skipped.

### Other variables (defaults are fine for local dev)

```env
DATABASE_URL=postgresql://marketingos:marketingos_dev@localhost:5432/marketingos
REDIS_URL=redis://localhost:6379
JWT_EXPIRES_IN=8h
SERVER_PORT=3001
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
NODE_ENV=development
```

### First admin user (seed)

These are used only once — when you run `npm run db:seed` to create the first admin account.

```env
SEED_ADMIN_EMAIL=admin@acefone.local
SEED_ADMIN_PASSWORD=changeme123
SEED_ADMIN_NAME=Admin
```

Change these to real values before seeding. The password is bcrypt-hashed and stored in PostgreSQL — it is NOT stored in plaintext after seeding.

---

## Step 3 — Start infrastructure (PostgreSQL + Redis)

```bash
npm run db:up
# Starts postgres and redis containers via Docker Compose
# Schema (schema.sql) runs automatically on first startup
```

Wait ~10 seconds, then verify:
```bash
docker compose ps
# postgres and redis should show "healthy"
```

---

## Step 4 — Install dependencies

```bash
npm install
# Installs both packages/backend and packages/frontend via npm workspaces
```

---

## Step 5 — Seed the first admin user

```bash
npm run db:seed -w @marketing-os/backend
```

This creates the first admin account using `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` from `.env`.

You can override inline:
```bash
SEED_ADMIN_EMAIL=you@acefone.com SEED_ADMIN_PASSWORD=secure123 npm run db:seed -w @marketing-os/backend
```

---

## Step 6 — Start development servers

```bash
npm run dev
```

- Backend (with hot reload): http://localhost:3001
- Frontend (Vite): http://localhost:3000

Open http://localhost:3000 — you should see the login page.

Log in with the admin credentials you seeded in Step 5.

---

## Step 7 — (Optional) Start the job scheduler

In a separate terminal:

```bash
npm run scheduler --workspace=packages/backend
```

This starts the Bull scheduler that registers recurring jobs (social posts, SEO reports, etc.) in Redis. Only needed if you want scheduled jobs to fire locally.

---

## Verify everything is working

```bash
# Health check
curl http://localhost:3001/api/health
# Expected: { "claude": "healthy", "database": "healthy" }

# TypeScript check
npm run typecheck

# Tests
npm run test

# Lint
npm run lint
```

---

## Credentials & User Management

There is no UI for user management yet — use curl or Postman with your admin JWT token.

### Get your admin JWT token

Log in via the UI or directly:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acefone.local","password":"changeme123"}'
# Returns: { "token": "eyJ...", "user": { "email": "...", "role": "admin" } }
```

Save the token — you'll use it as `<ADMIN_TOKEN>` below.

### Create a new user

```bash
curl -X POST http://localhost:3001/api/auth/users \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@acefone.com",
    "password": "welcome123",
    "role": "editor"
  }'
```

Roles:
- `admin` — full access + user management
- `editor` — run agents, view everything
- `viewer` — read-only (no agent runs)

### List all users

```bash
curl http://localhost:3001/api/auth/users \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### Change a user's role

```bash
curl -X PATCH http://localhost:3001/api/auth/users/<USER_ID> \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"role": "viewer"}'
```

### Deactivate a user (e.g. when someone leaves)

```bash
curl -X PATCH http://localhost:3001/api/auth/users/<USER_ID> \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
```

Deactivated users cannot log in. Their past outputs remain in the database.

### Change a user's password

Passwords cannot be changed via the API yet. To reset:
1. Deactivate the old account
2. Create a new account with the same email (after deactivation)

Or connect directly to PostgreSQL and update the `password_hash`:
```bash
docker compose exec postgres psql -U marketingos -d marketingos

# Inside psql — replace the hash with a new bcrypt hash
UPDATE users SET password_hash = '<new-bcrypt-hash>' WHERE email = 'jane@acefone.com';
```

To generate a bcrypt hash:
```bash
node -e "const b = require('bcrypt'); b.hash('newpassword', 12).then(console.log)"
```

---

## Environment Variable Reference

Full `.env.example`:

```env
# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Notion (optional)
NOTION_TOKEN=secret_...
NOTION_DATABASE_ID=...

# Database
DATABASE_URL=postgresql://marketingos:marketingos_dev@localhost:5432/marketingos
POSTGRES_PASSWORD=marketingos_dev

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=<generate with crypto.randomBytes(64).toString('hex')>
JWT_EXPIRES_IN=8h

# Server
SERVER_PORT=3001
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
NODE_ENV=development

# Seed (used only by db:seed script — can remove after first run)
SEED_ADMIN_EMAIL=admin@acefone.local
SEED_ADMIN_PASSWORD=changeme123
SEED_ADMIN_NAME=Admin
```

---

*For server deployment (corporate LAN hosting) → see [server.md](server.md)*
