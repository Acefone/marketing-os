# Marketing Agent OS — WSL Setup Notes

## Objective

Run the project reliably using WSL Ubuntu with Linux Node.js/npm, Docker, PostgreSQL, Redis, and VS Code connected to WSL.

---

## Initial Problems Identified

### 1. Project stored on Windows filesystem

Original location: `/mnt/c/Users/Testuser2/Desktop/makreting-os-opensoruce`

Issues caused:
- Slow `npm install`
- File watcher/hot reload issues
- Permission quirks
- Toolchain mixing between Windows and Linux

### 2. Wrong npm being used inside WSL

`which npm` returned a Windows path: `/mnt/c/Program Files/nodejs/npm`

This caused scripts to run through Windows tooling and produced:
```
'docker' is not recognized as an internal or external command
```

### 3. Docker Compose command mismatch

Project used `docker compose` but the installed system only supported `docker-compose`.

### 4. Port conflicts

Old containers were already using:
- PostgreSQL → `5433`
- Redis → `6379`

---

## Final Working Setup

### Step 1 — Install Linux Node.js in WSL

```bash
sudo apt update
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify:

```bash
which node
which npm
node -v
npm -v
```

Expected Linux paths:
- `/usr/bin/node`
- `/usr/bin/npm`

---

### Step 2 — Move Project into Linux Filesystem

```bash
cd ~
cp -r /mnt/c/Users/Testuser2/Desktop/makreting-os-opensoruce ~/marketing-os
cd ~/marketing-os
```

Final location: `/home/testuser/marketing-os`

Benefits:
- Faster installs
- Better performance
- Native Linux tooling
- Cleaner Docker integration

---

### Step 3 — Open Project in VS Code (WSL)

```bash
code .
```

Use VS Code with WSL integration. Recommended terminal inside VS Code: **Ubuntu / WSL Bash**

---

### Step 4 — Start Docker in WSL

```bash
sudo service docker start
```

Verify:

```bash
docker ps
```

---

### Step 5 — Create Environment File

```bash
cp .env.example .env
```

Edit `.env` and configure required values:

```env
POSTGRES_PASSWORD=...
JWT_SECRET=...
ANTHROPIC_API_KEY=...
```

---

### Step 6 — Use Legacy Docker Compose Command

```bash
docker-compose up -d postgres redis
```

> This environment uses Compose v1 (`docker-compose`).

---

### Step 7 — Resolve Port Conflicts

Old containers from the previous setup were running:
- `makreting-os-opensoruce_postgres_1`
- `makreting-os-opensoruce_redis_1`

These were stopped and removed so new containers could bind to ports.

---

### Step 8 — Verify Running Services

```bash
docker ps
```

Healthy containers:
- `marketing-os_postgres_1`
- `marketing-os_redis_1`

---

## Current Architecture

```
WSL Ubuntu
 ├── ~/marketing-os
 ├── Linux Node.js/npm
 ├── Docker Engine
 ├── PostgreSQL container
 ├── Redis container
 └── VS Code via WSL
```

---

## Daily Startup Workflow

Run each work session:

```bash
cd ~/marketing-os
sudo service docker start
docker-compose up -d
npm run dev
```

Optional — start scheduler in a second terminal:

```bash
cd ~/marketing-os
npm run scheduler --workspace=packages/backend
```

---

## Useful Commands

| Task | Command |
|------|---------|
| Check Node | `which node` |
| Check npm | `which npm` |
| Check containers | `docker ps` |
| Start containers | `docker-compose up -d` |
| Stop containers | `docker-compose down` |
| Open VS Code | `code .` |

---

## Best Practices

| ❌ Do NOT use | ✅ Use instead |
|--------------|----------------|
| `/mnt/c/...` for active development | `~/marketing-os` |
| Windows npm | Linux npm (`which npm` → `/usr/bin/npm`) |

---

## Future Improvements

- [ ] Upgrade to Docker Compose v2 (`docker compose`)
- [ ] Add startup shell script
- [ ] Enable Docker auto-start
- [ ] Add shell aliases
- [ ] Improve terminal environment (zsh / oh-my-zsh)

---

## Final Result

Environment successfully migrated from a mixed Windows/WSL setup to a clean, Linux-native development workflow.