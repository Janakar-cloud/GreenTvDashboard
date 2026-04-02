#!/bin/bash
# =============================================================================
# GreenTV Dashboard — AWS EC2 Deployment Script
# Run this script on a fresh Ubuntu 22.04 / 24.04 EC2 instance.
# Pre-requisites: Git, Node.js 20+, Nginx
# =============================================================================

set -euo pipefail

APP_DIR="/var/www/greentv"
REPO_URL="https://github.com/murali091988/GreenTvDashboard.git"
BRANCH="Backend"
NGINX_CONF="/etc/nginx/sites-available/greentv"

echo "==> [1/7] Updating system packages..."
sudo apt-get update -y && sudo apt-get upgrade -y

echo "==> [2/7] Installing Node.js 20.x..."
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
node -v
npm -v

echo "==> [3/7] Installing Nginx..."
if ! command -v nginx &>/dev/null; then
  sudo apt-get install -y nginx
fi

echo "==> [4/7] Cloning / updating repository..."
if [ -d "$APP_DIR/.git" ]; then
  echo "    Repo already cloned — pulling latest changes..."
  cd "$APP_DIR"
  git fetch origin
  git checkout "$BRANCH"
  git pull origin "$BRANCH"
else
  sudo mkdir -p "$APP_DIR"
  sudo chown "$USER":"$USER" "$APP_DIR"
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

echo "==> [5/7] Installing dependencies and building..."
cd "$APP_DIR"
npm install --legacy-peer-deps
npm run build

echo "==> [6/7] Configuring Nginx..."
sudo tee "$NGINX_CONF" > /dev/null <<'EOF'
server {
    listen 80;
    server_name _;

    root /var/www/greentv/dist;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

# Enable site
sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/greentv

# Disable default site if present
if [ -f /etc/nginx/sites-enabled/default ]; then
  sudo rm -f /etc/nginx/sites-enabled/default
fi

sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

echo "==> [7/7] Deployment complete!"
echo "    Dashboard is available at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo '<EC2_PUBLIC_IP>')"
