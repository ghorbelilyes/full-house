# VPS PM2 Deployment Runbook

This guide is for the current non-Docker VPS deployment.

- Server: `root@212.47.79.230`
- App path on server: `/var/www/full-house`
- Process manager: PM2 app named `full-house`
- Public temporary URL: `http://212.47.79.230:3000`
- Admin login URL: `http://212.47.79.230:3000/admin/user/login`

Do not deploy over the server without preserving `.env` and `config/production.json`.
Those files contain server-only settings. If they are overwritten, the app can fail
with database authentication errors or generate `localhost:3000` admin requests.

## 1. Before Deployment

Run these on the server from any directory:

```bash
pm2 list
ss -ltnp | grep 3000
curl -I http://212.47.79.230:3000/admin/user/login
```

Create dated backups on the server:

```bash
mkdir -p /root/backups/code /root/backups/db
cp -a /var/www/full-house /root/backups/code/full-house-code-$(date +%F-%H%M)
```

Back up PostgreSQL using the password already stored in the server `.env`:

```bash
cd /var/www/full-house
set -a
. ./.env
set +a
PGPASSWORD="$DB_PASSWORD" pg_dump -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" \
  | gzip > /root/backups/db/full-house-db-$(date +%F-%H%M).sql.gz
ls -lh /root/backups/code /root/backups/db
```

Verify database login before making changes:

```bash
cd /var/www/full-house
set -a
. ./.env
set +a
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;"
```

## 2. Package New Code Locally

Run these on the laptop from the project root:

```bash
cd "/home/ilyes/custom projects/full-house-prod/full-house"
tar \
  --exclude=node_modules \
  --exclude=.git \
  --exclude=.env \
  --exclude=.env.local-vps \
  --exclude=config/production.json \
  -czf full-house-deploy-new.tar.gz .
scp full-house-deploy-new.tar.gz root@212.47.79.230:/root/full-house-deploy-new.tar.gz
```

The exclusions are important. Server secrets and server URL config must stay on
the server.

## 3. Deploy New Code On Server

Run from any directory:

```bash
pm2 stop full-house
cp -a /var/www/full-house /root/backups/code/full-house-before-deploy-$(date +%F-%H%M)
```

Run from `/var/www/full-house`:

```bash
cd /var/www/full-house
cp .env /root/full-house-env-before-deploy-$(date +%F-%H%M)
cp config/production.json /root/full-house-production-json-before-deploy-$(date +%F-%H%M) 2>/dev/null || true
tar -xzf /root/full-house-deploy-new.tar.gz -C /var/www/full-house --strip-components=1
```

After extraction, confirm the server config is still correct:

```bash
cd /var/www/full-house
grep -n "DB_HOST\|DB_NAME\|DB_USER" .env
grep -q "^DB_PASSWORD=." .env && echo "DB_PASSWORD is set"
cat > config/production.json <<'EOF'
{
  "shop": {
    "homeUrl": "http://212.47.79.230:3000"
  }
}
EOF
```

Test database credentials before building:

```bash
cd /var/www/full-house
set -a
. ./.env
set +a
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;"
```

## 4. Build Safely

Run from `/var/www/full-house`:

```bash
npm install
npm run compile:db
npm run compile
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

If build fails with `JavaScript heap out of memory`, do not restart PM2 yet.
Add swap, then retry:

```bash
fallocate -l 4G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
free -h
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

Only restart after a successful build.

## 5. Restart And Verify

Run from any directory:

```bash
pm2 restart full-house --update-env
pm2 save
pm2 logs full-house --lines 50
```

Expected healthy log:

```text
Your website is running at "http://localhost:3000"
```

Warnings like these are not fatal:

```text
NODE_APP_INSTANCE value of '0' did not match any instance config file names.
Extension languageSwitcher is not enabled. Skipping.
Extension darkMode is not enabled. Skipping.
```

Test from the server:

```bash
curl -I http://212.47.79.230:3000
curl -I http://212.47.79.230:3000/admin/user/login
```

Use `http://212.47.79.230:3000/admin/user/login` for admin. A `404` on
`/admin` alone does not always mean the app is broken.

## 6. Rollback To Last Working Code

Use this only if the new deployment fails and the site must be restored quickly.

Run from any directory:

```bash
pm2 stop full-house
mv /var/www/full-house /var/www/full-house-broken-$(date +%F-%H%M)
```

List available backups:

```bash
ls -ld /root/backups/code/full-house-* /root/full-house-backup-* 2>/dev/null
```

Restore the chosen backup. Replace `BACKUP_PATH` with the exact path:

```bash
cp -a BACKUP_PATH /var/www/full-house
cd /var/www/full-house
```

Confirm the structure is correct. This `ls` must show `package.json` directly,
not another nested backup folder:

```bash
ls
```

Verify `.env` and `config/production.json`:

```bash
cd /var/www/full-house
grep -n "DB_HOST\|DB_NAME\|DB_USER" .env
grep -q "^DB_PASSWORD=." .env && echo "DB_PASSWORD is set"
cat > config/production.json <<'EOF'
{
  "shop": {
    "homeUrl": "http://212.47.79.230:3000"
  }
}
EOF
```

Test DB and restart:

```bash
cd /var/www/full-house
set -a
. ./.env
set +a
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;"
pm2 restart full-house --update-env
pm2 save
pm2 logs full-house --lines 50
```

## 7. Common Problems

### Browser admin login calls localhost

Cause: `shop.homeUrl` is still `http://localhost:3000`.

Fix on the server from `/var/www/full-house`:

```bash
cat > config/production.json <<'EOF'
{
  "shop": {
    "homeUrl": "http://212.47.79.230:3000"
  }
}
EOF
NODE_OPTIONS="--max-old-space-size=4096" npm run build
pm2 restart full-house --update-env
pm2 save
```

### App logs show database password failed

Cause: `.env` was overwritten or contains wrong DB settings.

Fix: restore `.env` from the latest working code backup or edit `.env`, then
verify with:

```bash
cd /var/www/full-house
set -a
. ./.env
set +a
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;"
pm2 restart full-house --update-env
```

### Build fails with heap out of memory

Cause: the VPS does not have enough available memory for the production build.

Fix: build with Node memory increased and add swap if needed:

```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### `http://212.47.79.230` shows another app

This is expected. Another app uses port `80`. Full House currently uses:

```text
http://212.47.79.230:3000
```

When a domain is available, configure Nginx and HTTPS for the domain instead of
using the raw IP and port.
