# Marketing Agent OS — Server Deployment Guide

This guide covers deploying to a single Linux server on your internal corporate network — no public cloud required.

---

## Server Requirements

| Resource | Minimum | Recommended |
|---|---|---|
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| CPU | 2 vCPUs | 4 vCPUs |
| RAM | 4 GB | 8 GB |
| Disk | 20 GB | 50 GB |
| Network | LAN only (no public IP needed) | LAN only |

---

## Step 1 — Prepare the server

SSH into the server instance, then install dependencies:

```bash
# Update packages
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js v20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version   # should print v20.x.x

# Install Docker + Docker Compose plugin
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker and enable on boot
sudo systemctl enable docker
sudo systemctl start docker

# Allow your deploy user to run docker without sudo
sudo usermod -aG docker $USER
# Log out and back in for this to take effect

# Install git and nginx
sudo apt-get install -y git nginx
```

---

## Step 2 — Deploy the codebase

### Option A — Git clone (if you have a git server on the LAN)

```bash
git clone <your-repo-url> /opt/marketing-os
cd /opt/marketing-os
```

### Option B — Copy files from your dev machine via rsync

```bash
# Run this on your dev machine
rsync -avz \
  --exclude node_modules \
  --exclude .git \
  --exclude packages/*/dist \
  . user@<server-ip>:/opt/marketing-os/
```

---

## Step 3 — Configure environment

```bash
cd /opt/marketing-os
cp .env.example .env
nano .env
```

Key values to set for production:

```env
NODE_ENV=production
CORS_ORIGIN=http://<server-lan-ip>:3000

# Generate a strong JWT secret
# Run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=<generated-secret>

# Use a strong DB password (not the dev default)
POSTGRES_PASSWORD=<strong-password>
DATABASE_URL=postgresql://marketingos:<strong-password>@postgres:5432/marketingos

ANTHROPIC_API_KEY=sk-ant-...
NOTION_TOKEN=secret_...        # optional
NOTION_DATABASE_ID=...         # optional

# Seed — used once for first admin user
SEED_ADMIN_EMAIL=admin@acefone.local
SEED_ADMIN_PASSWORD=<secure-password>
```

---

## Step 4 — Build and start all services

```bash
cd /opt/marketing-os

# Install dependencies
npm install

# Build backend TypeScript → dist/
npm run build --workspace=packages/backend

# Build frontend Vite → dist/
npm run build --workspace=packages/frontend

# Start all 5 Docker services
# Docker handles restart automatically (restart: unless-stopped)
docker compose up -d --build

# Verify all services are running
docker compose ps
# Expected: postgres, redis, backend, scheduler, frontend — all "Up (healthy)"
```

---

## Step 5 — Seed the first admin user

```bash
cd /opt/marketing-os

SEED_ADMIN_EMAIL=admin@acefone.local \
SEED_ADMIN_PASSWORD=<secure-password> \
npm run db:seed --workspace=packages/backend
```

---

## Step 6 — Configure nginx to serve the frontend

The frontend Docker container (port 3000) already handles serving via nginx internally. If you want nginx on the host to proxy traffic on standard ports:

```bash
sudo nano /etc/nginx/sites-available/marketing-os
```

Paste:

```nginx
server {
    listen 80;
    server_name _;   # accepts any hostname — for LAN use only

    # Proxy to frontend container
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Proxy /api directly to backend
    location /api {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Connection "";
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/marketing-os /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default   # remove default site
sudo nginx -t                              # test config
sudo systemctl restart nginx
sudo systemctl enable nginx
```

Users on the LAN now access the app at:
```
http://<server-lan-ip>
```

---

## Step 7 — Firewall (recommended)

Allow only LAN traffic to app ports:

```bash
# Adjust 192.168.0.0/16 to match your corporate LAN subnet
sudo ufw allow from 192.168.0.0/16 to any port 80    # nginx (frontend)
sudo ufw allow from 192.168.0.0/16 to any port 3000  # frontend direct
sudo ufw allow from 192.168.0.0/16 to any port 3001  # backend API
sudo ufw allow 22                                     # SSH
sudo ufw enable
```

---

## Updating the deployment

```bash
cd /opt/marketing-os

# Pull latest code (or rsync from dev)
git pull

# Rebuild and restart
npm install
docker compose up -d --build
```

---

## Operations & Monitoring

### Daily health check

```bash
# API health
curl http://localhost:3001/api/health
# Expected: { "claude": "healthy", "database": "healthy" }

# Container status
docker compose ps

# Failed jobs in the last 24h
docker compose exec postgres psql -U marketingos -d marketingos -c "
  SELECT job_name, status, error_message, created_at
  FROM job_runs
  WHERE status = 'failed' AND created_at > NOW() - INTERVAL '24 hours';"
```

### View logs

```bash
docker compose logs -f                   # all services, live
docker compose logs -f backend           # backend only
docker compose logs -f scheduler         # scheduler only
docker compose logs --tail=100 backend   # last 100 lines
```

### Restart services

```bash
docker compose restart backend           # restart API only
docker compose restart scheduler         # restart scheduler only
docker compose restart                   # restart everything
```

### View recent outputs

```bash
docker compose exec postgres psql -U marketingos -d marketingos -c "
  SELECT agent_id, task_type, status, duration_ms, created_at
  FROM agent_outputs
  ORDER BY created_at DESC
  LIMIT 10;"
```

---

## Error Escalation

| Symptom | First check | Owner |
|---|---|---|
| Agent produces wrong output | Review `/agents/{agent}/CLAUDE.md` | AI Marketer |
| Scheduled job did not fire | `docker compose logs scheduler` + check `job_runs` table | BE Dev |
| Notion entry missing | Output is in PostgreSQL — Notion is secondary. Check `NOTION_TOKEN` expiry | BE Dev |
| Login not working | `docker compose logs backend` + verify `JWT_SECRET` is set | BE Dev |
| Database connection error | `docker compose ps` — check postgres is healthy | BE Dev |
| High API spend | Anthropic Console → Usage, compare Sonnet vs Haiku | Both |

---

## Security Checklist

Run monthly or after any team change:

- [ ] `.env` is in `.gitignore` — never committed (`git log -- .env` to verify)
- [ ] No API keys in committed files (`git log --all -p | grep ANTHROPIC_API_KEY`)
- [ ] Rotate `JWT_SECRET` if admin leaves → update `.env` → `docker compose restart`
- [ ] Deactivate leavers: `PATCH /api/auth/users/:id` with `{ "isActive": false }`
- [ ] Rotate `ANTHROPIC_API_KEY` in Anthropic Console if key may be exposed
- [ ] PostgreSQL not exposed outside the container network (docker binds to internal network by default)
- [ ] Redis not exposed publicly
- [ ] Review user list: `GET /api/auth/users` — no unexpected accounts
- [ ] nginx not serving on a public interface if server has a public IP

---

## Cost Monitoring

The only paid external service is **Anthropic Claude API**.

| Model | Used by | Cost |
|---|---|---|
| claude-sonnet-4-6 | editor, content-writer, strategy, seo, paid-media | Higher |
| claude-haiku-4-5 | social, fe-dev, be-dev, ux | ~20× cheaper |

**Cost levers:**
- Keep KB files lean — context length directly affects cost per call
- Don't upgrade Haiku agents to Sonnet unless output quality requires it
- Monitor at: console.anthropic.com → Usage → set a spend alert at 70% of monthly budget

---

*For local dev setup → see [setup.md](setup.md)*  
*For architecture details → see [architecture.md](architecture.md)*
