#!/bin/bash
# ═══════════════════════════════════════════════════
# Nginx + SSL setup — run AFTER deploy & DNS is set
# ═══════════════════════════════════════════════════
set -e

# ⚠️ CHANGE THIS to your actual domain
DOMAIN="yourdomain.com"

echo "═══ Setting up Nginx for ${DOMAIN} ═══"

sudo tee /etc/nginx/sites-available/full-house > /dev/null << EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/full-house /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

echo "═══ Setting up SSL ═══"
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}

echo ""
echo "✅ Nginx + SSL configured!"
echo "   Site live at: https://${DOMAIN}"
