#!/bin/bash
# ═══════════════════════════════════════════════════
# Full House — VPS Deployment Script
# Run this ON THE VPS after uploading the files
# ═══════════════════════════════════════════════════
set -e

APP_DIR="/var/www/full-house"
DB_NAME="full_house"
DB_USER="postgres"
DB_PASS="FullH0use_Pr0d_2025!"

echo "═══ 1/7 — System update & dependencies ═══"
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential nginx certbot python3-certbot-nginx

echo "═══ 2/7 — Install Node.js 20 via nvm ═══"
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20
nvm alias default 20
npm install -g pm2

echo "═══ 3/7 — Install PostgreSQL 16 ═══"
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Set password and create database
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '${DB_PASS}';"
sudo -u postgres createdb ${DB_NAME} 2>/dev/null || echo "DB already exists"

# Import the dump
sudo -u postgres psql ${DB_NAME} < ~/full_house_deploy.sql
echo "✅ Database imported"

echo "═══ 4/7 — Extract application ═══"
sudo mkdir -p ${APP_DIR}
sudo chown -R $USER:$USER ${APP_DIR}
cd ${APP_DIR}
tar xzf ~/full-house-deploy.tar.gz

echo "═══ 5/7 — Create .env ═══"
cat > ${APP_DIR}/.env << ENVEOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASS}
DB_SSLMODE=disable

# ⚠️ CHANGE THIS to your actual domain
STORE_URL=https://yourdomain.com
STORE_NAME=Full House

EMAIL_FROM=contact@yourdomain.com
EMAIL_FROM_NAME=Full House
ADMIN_EMAIL=admin@yourdomain.com

SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
SMTP_FROM_NAME=
SMTP_REPLY_TO_EMAIL=
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
SENDGRID_FROM_NAME=
SENDGRID_REPLY_TO_EMAIL=

JWT_ISSUER=fullhouse-prod
JWT_ADMIN_SECRET=$(openssl rand -base64 48)
JWT_ADMIN_REFRESH_SECRET=$(openssl rand -base64 48)
JWT_CUSTOMER_SECRET=$(openssl rand -base64 48)
JWT_CUSTOMER_REFRESH_SECRET=$(openssl rand -base64 48)

JWT_ADMIN_TOKEN_EXPIRY=900
JWT_ADMIN_REFRESH_TOKEN_EXPIRY=54000
JWT_CUSTOMER_TOKEN_EXPIRY=1800
JWT_CUSTOMER_REFRESH_TOKEN_EXPIRY=108000

GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o
AI_DESCRIPTION_API_KEY=
AI_DESCRIPTION_MODEL=gpt-4o
AI_DESCRIPTION_BASE_URL=https://api.openai.com/v1
ENVEOF

echo "═══ 6/7 — Install, compile & build ═══"
cd ${APP_DIR}
npm install

# Compile postgres-query-builder
(cd node_modules/@evershop/postgres-query-builder && [ ! -d dist ] && npx tsc || true)

# Compile core
npm run compile

# Copy Card.js + Table.js
cp packages/evershop/src/components/common/ui/Card.js packages/evershop/dist/components/common/ui/Card.js 2>/dev/null || true
cp packages/evershop/src/components/common/ui/Table.js packages/evershop/dist/components/common/ui/Table.js 2>/dev/null || true

# Fix assert → with
find packages/evershop/dist -name '*.js' -exec grep -l "assert {" {} \; | while read f; do
  sed -i "s/from '\(.*\.json\)' assert {/from '\1' with {/g" "$f"
  sed -i "s/from \"\(.*\.json\)\" assert {/from \"\1\" with {/g" "$f"
done

# Compile extensions
for ext in extensions/*/; do
  if [ -d "$ext/src" ]; then
    name=$(basename "$ext")
    echo "  → Compiling $name"
    (cd "$ext" && ../../node_modules/.bin/swc src/ -d dist/ --config-file ../../packages/evershop/.swcrc --copy-files --strip-leading-paths)
  fi
done

# Build frontend
npm run build

echo "═══ 7/7 — Start with PM2 ═══"
cd ${APP_DIR}
pm2 delete full-house 2>/dev/null || true
pm2 start npm --name "full-house" -- run start
pm2 save

# Setup PM2 startup (run the command it prints)
pm2 startup

echo ""
echo "══════════════════════════════════════════════"
echo "✅ DEPLOYMENT COMPLETE!"
echo "══════════════════════════════════════════════"
echo ""
echo "App running at: http://$(curl -s ifconfig.me):3000"
echo ""
echo "⚠️  NEXT STEPS:"
echo "  1. Edit .env → set STORE_URL to your domain"
echo "  2. Setup Nginx (see nginx-setup.sh)"
echo "  3. Setup SSL with certbot"
echo "  4. Run: pm2 restart full-house"
echo ""
