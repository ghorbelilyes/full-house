# Protek - Local Fake VPS Deployment

This setup runs your EverShop source project on a local Ubuntu Server VM with Docker Compose.

Target VM:
- Ubuntu Server 24.04
- 2 vCPU
- 4 GB RAM
- 60-80 GB disk

## 1) Files Included

- `Dockerfile`: builds your local source monorepo (Node 20 + EverShop compile/build cycle)
- `docker-compose.yml`: app + PostgreSQL + Redis + Nginx reverse proxy
- `.dockerignore`: reduces Docker build context size
- `.env.local-vps.example`: local-safe environment template
- `scripts/deploy-local-vps.sh`: build/start stack and apply safety defaults
- `scripts/backup-postgres.sh`: compressed PostgreSQL backup
- `scripts/restore-postgres.sh`: restore SQL backup
- `docker/nginx/default.conf`: HTTP reverse proxy

## 2) VM Preparation (one time)

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
newgrp docker
```

Optional firewall:
```bash
sudo ufw allow 80/tcp
sudo ufw status
```

## 3) Configure Environment

```bash
cp .env.local-vps.example .env.local-vps
```

Edit `.env.local-vps`:
- `HTTP_PORT`: exposed HTTP port on VM (usually `80`)
- `DB_NAME/DB_USER/DB_PASSWORD`: local database credentials
- `STORE_URL`: set to VM LAN URL, for example `http://192.168.1.50`
- `JWT_*`: set long random values (required)
- Keep email and AI keys empty for local safe testing

### Environment Variable Reference

| Variable | Purpose | Sensitive | Local fake VPS value |
|---|---|---|---|
| `HTTP_PORT` | VM HTTP port published by Nginx | No | `80` |
| `DB_NAME` | PostgreSQL database name | No | `full_house` |
| `DB_USER` | PostgreSQL user | Low | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | Yes | `postgres` for local only |
| `DB_SSLMODE` | DB SSL mode inside Docker network | No | `disable` |
| `STORE_URL` | Public URL used by app links/emails | No | `http://<VM_IP>` |
| `STORE_NAME` | Store label used in emails/UI defaults | No | `Protek Local VPS` |
| `EMAIL_FROM` | Default sender email | No | `local@test.invalid` |
| `EMAIL_FROM_NAME` | Default sender display name | No | `Protek Local` |
| `ADMIN_EMAIL` | Admin contact fallback | Low | `admin@local.test` |
| `SMTP_*` | SMTP provider settings | Yes | leave empty |
| `SENDGRID_*` | SendGrid provider settings | Yes | leave empty |
| `JWT_ISSUER` | JWT issuer value | No | `fullhouse-local-vps` |
| `JWT_ADMIN_SECRET` | Admin JWT signing secret | Yes | random 32+ chars |
| `JWT_ADMIN_REFRESH_SECRET` | Admin refresh token secret | Yes | random 32+ chars |
| `JWT_CUSTOMER_SECRET` | Customer JWT signing secret | Yes | random 32+ chars |
| `JWT_CUSTOMER_REFRESH_SECRET` | Customer refresh token secret | Yes | random 32+ chars |
| `JWT_ADMIN_TOKEN_EXPIRY` | Admin token TTL (seconds) | No | `900` |
| `JWT_ADMIN_REFRESH_TOKEN_EXPIRY` | Admin refresh TTL (seconds) | No | `54000` |
| `JWT_CUSTOMER_TOKEN_EXPIRY` | Customer token TTL (seconds) | No | `1800` |
| `JWT_CUSTOMER_REFRESH_TOKEN_EXPIRY` | Customer refresh TTL (seconds) | No | `108000` |
| `CLIENT_FEATURES` | Disable risky feature modules | No | `{"whatsappNotifications":false,"aiProductDescriptions":false}` |
| `GEMINI_*` | Gemini provider settings | Yes | keep keys empty |
| `OPENAI_*` | OpenAI provider settings | Yes | keep keys empty |
| `AI_DESCRIPTION_*` | AI description fallback provider settings | Yes | keep keys empty |

## 4) Deploy

```bash
chmod +x scripts/deploy-local-vps.sh scripts/backup-postgres.sh scripts/restore-postgres.sh
./scripts/deploy-local-vps.sh
```

This script:
1. Builds the app image
2. Starts `db`, `redis`, `app`, `nginx`
3. Sets `stripePaymentStatus=0` and `paypalPaymentStatus=0` for safety
4. Restarts app

## 5) Start/Stop/Logs

```bash
docker compose --env-file .env.local-vps up -d
docker compose --env-file .env.local-vps down
docker compose --env-file .env.local-vps logs -f app
docker compose --env-file .env.local-vps ps
```

## 6) Access From Your Main Computer

Find VM IP:
```bash
hostname -I
```

Open from your main computer:
- `http://<VM_IP>` (if `HTTP_PORT=80`)
- `http://<VM_IP>:<HTTP_PORT>` (if custom port)

Example:
- `http://192.168.1.50`

## 7) Backups

Create backup:
```bash
./scripts/backup-postgres.sh
```

Restore backup:
```bash
./scripts/restore-postgres.sh backups/fullhouse_YYYYMMDD_HHMMSS.sql.gz
```

## 8) Local Safety Notes

- PostgreSQL is not exposed to host network (internal Docker network only)
- Payment methods are forced disabled by deploy script
- Email providers remain inactive when SMTP/SendGrid secrets are empty
- AI provider keys are empty by default
- Redis is included for future compatibility but not required by current app code
