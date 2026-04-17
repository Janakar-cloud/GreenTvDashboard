#!/bin/bash
# =============================================================================
# GreenTV Dashboard — AWS EC2 Deployment Script
# Works for both FRESH installs and REDEPLOYMENTS on Ubuntu 22.04 / 24.04.
#
# Architecture:
#   Browser → Nginx (443/SSL) → PM2 `serve` (port 3039) [React SPA]
#                             → Node.js backend (port 4000) [/api/*]
#
# Usage:
#   Fresh install : bash deploy-ec2.sh
#   Redeploy only : bash deploy-ec2.sh --redeploy
# =============================================================================

set -euo pipefail

APP_DIR="/var/www/greentv"
REPO_URL="https://github.com/murali091988/GreenTvDashboard.git"
BRANCH="Backend"
NGINX_CONF="/etc/nginx/sites-available/greentv"
PM2_PORT=3039
DOMAIN="dashboard.thegreentv.com"

REDEPLOY_ONLY=false
if [[ "${1:-}" == "--redeploy" ]]; then
  REDEPLOY_ONLY=true
fi

# ─── Helper ───────────────────────────────────────────────────────────────────
log() { echo -e "\n\033[1;32m==> $*\033[0m"; }
err() { echo -e "\033[1;31m[ERROR] $*\033[0m" >&2; exit 1; }

# ─── Step 1: System packages (skip on redeploy) ───────────────────────────────
if ! $REDEPLOY_ONLY; then
  log "[1/8] Updating system packages..."
  sudo apt-get update -y && sudo apt-get upgrade -y

  log "[2/8] Installing Node.js 20.x..."
  if ! command -v node &>/dev/null || [[ "$(node -v)" != v20* ]]; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
  fi
  echo "Node: $(node -v) | npm: $(npm -v)"

  log "[3/8] Installing Nginx..."
  if ! command -v nginx &>/dev/null; then
    sudo apt-get install -y nginx
  fi

  log "[4/8] Installing PM2 + serve globally..."
  sudo npm install -g pm2 serve
fi

# ─── Step 2: Clone or pull repo ───────────────────────────────────────────────
log "[5/8] Syncing repository..."
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git fetch origin
  git checkout "$BRANCH"
  git reset --hard "origin/$BRANCH"
else
  sudo mkdir -p "$APP_DIR"
  sudo chown "$USER":"$USER" "$APP_DIR"
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

# ─── Step 3: Install deps & build ────────────────────────────────────────────
log "[6/8] Installing dependencies and building..."
cd "$APP_DIR"
npm install --legacy-peer-deps

# Build uses .env.production automatically (VITE_API_BASE_URL=/api/v1)
npm run build

[ -d "$APP_DIR/dist" ] || err "Build failed — dist/ not found."
echo "    Build output: $(du -sh dist | cut -f1)"

# ─── Step 4: PM2 — start or reload ───────────────────────────────────────────
log "[7/8] Starting / reloading PM2..."

if pm2 list | grep -q "thegreentv-dashboard"; then
  # Zero-downtime reload using ecosystem file
  pm2 reload "$APP_DIR/ecosystem.config.cjs" --update-env
else
  # First-time start
  pm2 start "$APP_DIR/ecosystem.config.cjs"
fi

pm2 save

# Register PM2 to start on reboot (idempotent)
pm2 startup systemd -u "$USER" --hp "$HOME" 2>/dev/null || true

# Verify the process is up
sleep 2
if ! pm2 list | grep -q "thegreentv-dashboard.*online"; then
  pm2 logs thegreentv-dashboard --lines 20 --nostream
  err "PM2 process did not come online. Check logs above."
fi

# ─── Step 5: Nginx ────────────────────────────────────────────────────────────
log "[8/8] Configuring Nginx..."

sudo tee "$NGINX_CONF" > /dev/null <<NGINX
# ─── Upstream: PM2 `serve` on port ${PM2_PORT} ─────────────────────────────────
upstream greentv_dashboard {
    server 127.0.0.1:${PM2_PORT};
    keepalive 32;
}

# ─── HTTP → HTTPS redirect ─────────────────────────────────────────────────────
server {
    listen 80;
    server_name ${DOMAIN};
    return 301 https://\$host\$request_uri;
}

# ─── HTTPS — main vhost ────────────────────────────────────────────────────────
server {
    listen 443 ssl;
    server_name ${DOMAIN};

    ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript
               text/xml application/xml application/xml+rss text/javascript
               image/svg+xml;

    add_header X-Frame-Options          "SAMEORIGIN"                      always;
    add_header X-Content-Type-Options   "nosniff"                         always;
    add_header Referrer-Policy          "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=15552000; includeSubDomains" always;

    # API → backend on port 4000
    location /api/ {
        proxy_pass         http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_set_header   Connection        "";
        proxy_read_timeout 60s;
    }

    # Static assets — long-term cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp|avif)\$ {
        proxy_pass         http://greentv_dashboard;
        proxy_http_version 1.1;
        proxy_set_header   Connection "";
        expires            1y;
        add_header         Cache-Control "public, immutable";
    }

    # SPA — all routes → PM2 static server
    location / {
        proxy_pass         http://greentv_dashboard;
        proxy_http_version 1.1;
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_set_header   Connection        "";
        proxy_intercept_errors on;
        error_page 404 = /index.html;
    }
}
NGINX

# Enable site, disable default
sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/greentv
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t || err "Nginx config test failed. Fix errors above."
sudo systemctl enable nginx
sudo systemctl reload nginx

# ─── Done ────────────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   GreenTV Dashboard deployed successfully!   ║"
echo "╠══════════════════════════════════════════════╣"
printf  "║   URL  : https://%-26s ║\n" "$DOMAIN"
printf  "║   Port : PM2 → localhost:%-19s ║\n" "${PM2_PORT}"
echo "║   API  : /api/v1 → localhost:4000            ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "Useful commands:"
echo "  pm2 status                          — service status"
echo "  pm2 logs thegreentv-dashboard       — live logs"
echo "  pm2 reload ecosystem.config.cjs     — zero-downtime redeploy"
echo "  bash deploy-ec2.sh --redeploy       — full redeploy (no apt)"

