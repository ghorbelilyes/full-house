# Full House — Deployment & Workflow Guide

> Current production uses the non-Docker PM2 flow on `212.47.79.230`.
> Before deploying, follow [VPS-PM2-DEPLOYMENT.md](./VPS-PM2-DEPLOYMENT.md)
> to preserve `.env`, keep `config/production.json`, back up PostgreSQL, and
> avoid build memory failures.

## 📋 Architecture

```
LOCAL (your machine)              VPS (production)
┌──────────────────────┐          ┌──────────────────────┐
│  Code + Test         │          │  Build + Run         │
│  localhost:3000      │  ──scp── │  212.47.79.230       │
│  DB: full_house_copy │  ──────→ │  DB: full_house      │
│  Node 20             │          │  Node 20 + PM2       │
└──────────────────────┘          └──────────────────────┘
```

---

## 🖥️ VPS Info

| Key | Value |
|---|---|
| Provider | Cloud VPS 10 SSD |
| IP | `212.47.79.230` |
| OS | Ubuntu 24.04 |
| CPU | 4 cores (2 allocated to app) |
| RAM | 8 GB (4 GB allocated to app) |
| User | `root` |
| App directory | `/var/www/full-house` |
| Process manager | PM2 |
| Web server | Nginx (reverse proxy) |
| DB | PostgreSQL 16 |

---

## 🔧 Local Setup

### Prerequisites
- Node.js 20 (via nvm)
- PostgreSQL 16
- Database: `full_house_copy`

### First time setup
```bash
cd "/home/ilyes/custom projects/full-house-prod/full-house"
npm install
./scripts/full-build.sh
npm run start
# Open http://localhost:3000
```

### Switch database
```bash
# Use the copy (for development)
# In .env: DB_NAME=full_house_copy

# Use the original
# In .env: DB_NAME=full_house
```

### Admin credentials
- **URL:** http://localhost:3000/admin
- **Email:** `admin@admin.com`
- **Password:** `admin123`

---

## 🔄 Daily Workflow

### 1. Make changes locally

Edit code in your project, then build and test:

```bash
cd "/home/ilyes/custom projects/full-house-prod/full-house"
./scripts/full-build.sh
npm run start
# Check http://localhost:3000
```

### 2. Deploy to VPS (one command)

```bash
./scripts/deploy.sh
```

This will:
1. Pack your code (excluding `node_modules`, `.git`, `.env`)
2. Upload to VPS via `scp`
3. Extract, install deps, compile, build
4. Restart the app with PM2

### 3. Sync database to VPS

```bash
./scripts/deploy-db.sh
```

> ⚠️ **Warning:** This REPLACES the VPS database with your local `full_house_copy`!

---

## 📜 Available Scripts

| Script | What it does | Run from |
|---|---|---|
| `./scripts/full-build.sh` | Full local build (compile + fix + build frontend) | Local |
| `./scripts/deploy.sh` | Push code to VPS, build & restart | Local |
| `./scripts/deploy-db.sh` | Push local DB to VPS (destructive!) | Local |
| `./scripts/vps-deploy.sh` | First-time VPS setup (run once) | VPS |
| `./scripts/nginx-setup.sh` | Setup Nginx + SSL for domain (run once) | VPS |

---

## 🐛 Debugging

### Check VPS logs
```bash
ssh root@212.47.79.230 "source ~/.nvm/nvm.sh && pm2 logs full-house --lines 50"
```

### Live tail logs
```bash
ssh root@212.47.79.230 "source ~/.nvm/nvm.sh && pm2 logs full-house"
# Ctrl+C to stop
```

### Restart app on VPS
```bash
ssh root@212.47.79.230 "source ~/.nvm/nvm.sh && pm2 restart full-house"
```

### Check app status on VPS
```bash
ssh root@212.47.79.230 "source ~/.nvm/nvm.sh && pm2 status"
```

### SSH into VPS
```bash
ssh root@212.47.79.230
```

### Check VPS disk space
```bash
ssh root@212.47.79.230 "df -h /"
```

### Check VPS memory
```bash
ssh root@212.47.79.230 "free -h"
```

---

## 🌐 Domain Setup (when ready)

### 1. Point DNS

Go to your domain registrar and add:

| Type | Name | Value |
|------|------|-------|
| A | @ | `212.47.79.230` |
| A | www | `212.47.79.230` |

Wait 5-10 minutes for DNS propagation.

### 2. Update `.env` on VPS

```bash
ssh root@212.47.79.230
nano /var/www/full-house/.env
# Change: STORE_URL=https://yourdomain.com
```

### 3. Run Nginx + SSL setup

```bash
ssh root@212.47.79.230
# Edit domain in the script first
nano ~/nginx-setup.sh
# Change: DOMAIN="yourdomain.com"

chmod +x ~/nginx-setup.sh
bash ~/nginx-setup.sh
```

### 4. Restart the app

```bash
ssh root@212.47.79.230 "source ~/.nvm/nvm.sh && pm2 restart full-house"
```

---

## 🔐 VPS Security Checklist

- [ ] Change root password: `passwd`
- [ ] Firewall enabled: `sudo ufw status` (ports 22, 80, 443)
- [ ] SSL certificate installed via certbot
- [ ] Strong DB password in `.env`
- [ ] Random JWT secrets in `.env` (generated with `openssl rand -base64 48`)

---

## 📦 Module Manager

Modules are defined in `config/modules.json`. All 7 modules:

| Module Code | Name | Settings Route |
|---|---|---|
| `coupons` | Coupons | `/admin/coupons` |
| `whatsappNotifications` | Commande WhatsApp | `/admin/whatsapp-setting` |
| `aiProductDescriptions` | Descriptions IA | `/admin/setting/ai-description` |
| `productReviews` | Avis produits | — |
| `wishlist` | Liste de souhaits | — |
| `spinToWin` | Roue de la chance | `/admin/setting/spin-to-win` |
| `referralProgram` | Programme de parrainage | `/admin/setting/referral` |

### Enable/disable modules
- **Admin UI:** `/admin/setting/modules`
- **ENV override:** `CLIENT_FEATURES` in `.env` (remove it to keep all modules included)
- **DB override:** `module_config` table

---

## 🏗️ Build Process Details

The `full-build.sh` script runs 5 steps:

```
0/5 — Compile postgres-query-builder (npx tsc, if dist/ missing)
1/5 — Compile core (swc: src/ → dist/)
2/5 — Copy Card.js + Table.js to dist/
3/5 — Fix import assert → with (Node 20 compatibility)
4/5 — Compile extensions (swc for each extension)
5/5 — Build frontend (webpack client + server bundles)
```

### Common build issues

| Error | Fix |
|---|---|
| `rimraf: not found` | Run `npm install` first |
| `Unexpected identifier 'assert'` | Run step 3 (assert → with fix) |
| `postgres-query-builder dist missing` | Run step 0 (`npx tsc` in that package) |
| `SASL: client password must be a string` | Add `DB_HOST` and `DB_PORT` to `.env` |

---

## 📁 Key Files & Directories

```
full-house/
├── .env                    # Local environment (DB, JWT, etc.)
├── config/
│   ├── default.json        # App config (extensions, logo, store settings)
│   └── modules.json        # Module definitions for Module Manager
├── extensions/             # Custom extensions
│   ├── buyNow/             # WhatsApp + Buy Now button
│   ├── moduleManager/      # Module toggle system
│   ├── spinToWin/          # Spin wheel popup
│   ├── referralProgram/    # Referral system
│   ├── wishlist/           # Wishlist
│   └── ...
├── packages/evershop/      # Core EverShop
│   ├── src/                # Source code
│   └── dist/               # Compiled (generated by build)
├── media/                  # Uploaded images (products, etc.)
├── public/                 # Static assets (logo, favicons)
├── scripts/
│   ├── full-build.sh       # Local full build
│   ├── deploy.sh           # Deploy code to VPS
│   ├── deploy-db.sh        # Deploy DB to VPS
│   ├── vps-deploy.sh       # First-time VPS setup
│   └── nginx-setup.sh      # Nginx + SSL setup
└── themes/                 # Frontend themes
```

---

## 🔄 Environment Files

| File | Purpose | Used by |
|---|---|---|
| `.env` | Active environment (loaded by app) | `dotenv/config` |
| `.env.local-vps` | Local Docker VPS template | Reference only |
| `.env.example` | Example for new developers | Reference only |
| VPS `.env` | Production env at `/var/www/full-house/.env` | VPS app |

> **Important:** The app loads `.env` from project root (not `.env.local-vps`).
> On VPS, the `.env` is created by `vps-deploy.sh` and preserved during `deploy.sh`.
