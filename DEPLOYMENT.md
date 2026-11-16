# Bhabhi Thulla — Cloud Deployment Guide

This guide provides instructions for deploying the **Bhabhi Thulla** online multiplayer card game to production using **Vercel** (Frontend), **Render** (Backend Node.js/Socket.IO Service), and **Managed PostgreSQL** (Neon, Render, Supabase, or AWS RDS).

---

## 🏗️ Production Architecture

```
[ Web Browser Clients ]
      |
      +---> HTTPS (CDN) ---> Vercel (React 18 / Vite SPA)
      |
      +---> WSS / HTTPS ---> Render (Node.js / Express / Socket.IO)
                                  |
                                  +---> Encrypted Snapshots & Stats
                                  |
                                  v
                             Managed PostgreSQL (Neon / Render / Supabase)
```

---

## 🗄️ Step 1: Managed PostgreSQL Database Setup

1. Provision a PostgreSQL 15+ database instance (recommended: Neon serverless or Render Managed PostgreSQL).
2. Note your database connection string:
   ```
   postgresql://<user>:<password>@<host>:<port>/<dbname>?sslmode=require
   ```
3. Run migrations from your terminal to establish schema tables and indexes:
   ```bash
   DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<dbname>?sslmode=require" npm run db:migrate --workspace=@bhabhi/server
   ```
   *Note: On clean deployment, schema tables (`guest_identities`, `game_matches`, `match_snapshots`, etc.) and performance indexes are automatically created.*

---

## 🚀 Step 2: Backend Deployment (Render Node.js Web Service)

1. Connect your GitHub repository to Render (`https://dashboard.render.com`).
2. Create a new **Web Service** with the following settings:
   - **Name**: `bhabhi-thulla-server`
   - **Environment**: `Node`
   - **Region**: Select the region closest to your database (e.g., Oregon or Frankfurt).
   - **Branch**: `main`
   - **Root Directory**: Leave blank (monorepo root).
   - **Build Command**:
     ```bash
     npm ci && npm run build --workspace=@bhabhi/shared && npm run build --workspace=@bhabhi/server
     ```
   - **Start Command**:
     ```bash
     node apps/server/dist/index.js
     ```
3. Configure **Environment Variables** in Render:
   | Variable | Value / Description |
   | :--- | :--- |
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` (Render default) or leave unset |
   | `HOST` | `0.0.0.0` |
   | `DATABASE_URL` | Your managed PostgreSQL connection string |
   | `DATABASE_SSL` | `true` |
   | `DATABASE_POOL_SIZE` | `10` |
   | `CLIENT_ORIGIN` | `https://your-frontend-app.vercel.app` (Add custom domains comma-separated) |
   | `SESSION_SECRET` | 64-char random hex string (Generate via `crypto.randomBytes(32).toString('hex')`) |
   | `GAME_STATE_ENCRYPTION_KEY` | 64-char random hex string (Generate via `crypto.randomBytes(32).toString('hex')`) |
   | `LOG_LEVEL` | `info` |

4. Configure **Health Check Path**:
   - Set to `/health` or `/ready`.
5. Deploy the service. Once deployed, Render provides your live backend URL (e.g., `https://bhabhi-thulla-server.onrender.com`). Verify by visiting `https://bhabhi-thulla-server.onrender.com/health`.

---

## 🌐 Step 3: Frontend Deployment (Vercel)

1. Connect your GitHub repository to Vercel (`https://vercel.com/new`).
2. In the project setup wizard:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `.` (monorepo root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `apps/web/dist`
3. Configure **Environment Variables** in Vercel:
   | Variable | Value |
   | :--- | :--- |
   | `VITE_API_URL` | `https://bhabhi-thulla-server.onrender.com` |
   | `VITE_SOCKET_URL` | `https://bhabhi-thulla-server.onrender.com` |
   | `VITE_PUBLIC_APP_URL` | `https://your-frontend-app.vercel.app` |
   | `VITE_APP_TITLE` | `Bhabhi Thulla` |

4. Click **Deploy**. Vercel compiles `@bhabhi/shared` and `@bhabhi/web`, generating immutable cached production assets and configuring SPA route rewrites via `vercel.json`.

---

## 🔒 Step 4: Verification Checklist

1. Open your Vercel production URL.
2. Confirm the home screen loads with green status and no connection warnings.
3. Click **Create Room** (select 4 players). Confirm a 6-character room code is generated and lobby opens.
4. Copy the invite link and open in an incognito or secondary browser session.
5. Verify Player 2 joins the lobby in real time.
6. Ready up both players and start the match.
7. Play through turns, trigger a Thulla, and verify state synchronization and database persistence.
8. Refresh one player's browser — verify reconnection within the 120s grace period.

---

## 🏷️ Custom Domain Setup

To use a custom domain (e.g., `bhabhithulla.com`):
1. **Frontend**: In Vercel, navigate to **Settings > Domains** and add `bhabhithulla.com`. Configure CNAME or ALIAS records in your DNS provider.
2. **Backend**: In Render, navigate to **Settings > Custom Domains** and add `api.bhabhithulla.com`.
3. **Environment Updates**:
   - In Render, update `CLIENT_ORIGIN` to include `https://bhabhithulla.com`.
   - In Vercel, update `VITE_API_URL` and `VITE_SOCKET_URL` to `https://api.bhabhithulla.com` and `VITE_PUBLIC_APP_URL` to `https://bhabhithulla.com`.

---

## 🤖 CI/CD Pipeline Setup (GitHub Actions)

The production CI/CD workflow is provided in `deploy/workflows/ci.yml`.

It automates:
- Monorepo package installation with npm cache
- Cross-workspace TypeScript compilation (`npm run typecheck`)
- ESLint code verification (`npm run lint`)
- Monorepo unit and integration test suites (`npm run test`)
- Monorepo production build (`npm run build`)
- Playwright end-to-end test execution

### Activating GitHub Actions in your Repository
If your Git Personal Access Token or repository permissions include the `workflow` scope:
```bash
mkdir -p .github/workflows
cp deploy/workflows/ci.yml .github/workflows/ci.yml
git add .github/workflows/ci.yml
git commit -m "ci: enable GitHub Actions workflow"
git push origin main
```

