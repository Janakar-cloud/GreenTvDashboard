# Dashboard Frontend Deployment Guide

This document explains how the frontend team should deploy the separate dashboard frontend repository on the same EC2 server that already runs the main website and API.

## Target Setup

- Main site: `https://www.thegreentv.com`
- Dashboard frontend: `https://dashboard.thegreentv.com`
- Backend API: proxied by Nginx to `http://127.0.0.1:4000`

This guide assumes:

- The dashboard repository is already cloned at `~/dashboard/GreenTvDashboard`
- The backend API from this repository is already running on the EC2 server
- Nginx is already installed on the EC2 server
- Ubuntu user is `ubuntu`

## Why This Setup

Use a separate subdomain for the dashboard instead of another `server_name _;` block or mixing the dashboard into the main site root. This avoids Nginx conflicts and keeps the dashboard isolated from the public website.

## 1. DNS

Create an `A` record:

```txt
dashboard.thegreentv.com -> 13.205.72.30
```

Wait until DNS resolves before requesting the SSL certificate.

## 2. Prepare Deployment Directory

```bash
sudo mkdir -p /var/www/dashboard/GreenTvDashboard
sudo chown -R ubuntu:ubuntu /var/www/dashboard
```

## 3. Pull and Build the Dashboard

```bash
cd ~/dashboard/GreenTvDashboard
git pull origin Backend
npm ci
```

Create the production environment file before building.

Preferred configuration:

```bash
cat > .env.production <<'EOF'
VITE_API_BASE_URL=/api/v1
EOF
```

Notes:

- If the dashboard repo uses a different Vite env key, the frontend team must use the exact key referenced by their code.
- Using `/api/v1` keeps the frontend same-origin with the dashboard domain and lets Nginx proxy API requests to the backend.

Build and publish:

```bash
npm run build
rsync -av --delete dist/ /var/www/dashboard/GreenTvDashboard/
```

## 4. Nginx Site Configuration

Create the Nginx site file:

```bash
sudo tee /etc/nginx/sites-available/greentv-dashboard > /dev/null <<'EOF'
server {
    listen 80;
    server_name dashboard.thegreentv.com;

    root /var/www/dashboard/GreenTvDashboard;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/json
        image/svg+xml;

    location /api/ {
        proxy_pass http://127.0.0.1:4000$request_uri;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
}
EOF
```

Enable the site and reload Nginx:

```bash
sudo ln -sf /etc/nginx/sites-available/greentv-dashboard /etc/nginx/sites-enabled/greentv-dashboard
sudo nginx -t
sudo systemctl reload nginx
```

## 5. SSL with Certbot

Install Certbot if needed:

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```

Request the certificate:

```bash
sudo certbot --nginx -d dashboard.thegreentv.com
```

Certbot will update the Nginx file automatically for HTTPS.

## 6. Backend CORS

If the backend is using an allowlist for origins, include the dashboard domain in `server/.env`.

Example:

```env
CORS_ORIGINS=https://www.thegreentv.com,https://dashboard.thegreentv.com,http://13.205.72.30
```

Then restart the backend process:

```bash
pm2 list
pm2 restart thegreentv-api
```

If the PM2 process uses a different name, restart that actual process name instead.

## 7. Verification Checklist

Open the dashboard:

```txt
https://dashboard.thegreentv.com
```

Verify:

1. The dashboard page loads successfully
2. Static assets load without `404`
3. Login works
4. API requests go to `/api/v1/...`
5. Nginx correctly proxies API calls to the backend

Useful commands:

```bash
curl -I https://dashboard.thegreentv.com
curl -I https://dashboard.thegreentv.com/api/v1/home
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
pm2 logs
```

## 8. Future Update Flow

For every new dashboard release:

```bash
cd ~/dashboard/GreenTvDashboard
git pull origin Backend
npm ci
npm run build
rsync -av --delete dist/ /var/www/dashboard/GreenTvDashboard/
sudo nginx -t
sudo systemctl reload nginx
```

## 9. Important Notes

1. Do not serve the dashboard directly from `/home/ubuntu/...` through Nginx. Use `/var/www/...`.
2. Do not create another catch-all site with `server_name _;` if the main website is already live on the same EC2 instance.
3. Do not run `vite dev` in production.
4. Keep the dashboard as a static build served by Nginx.
5. The backend must continue listening on `127.0.0.1:4000` for the proxy configuration above.

## 10. Alternative: Host Under `/dashboard/`

If the team insists on serving the dashboard from `https://www.thegreentv.com/dashboard/` instead of a separate subdomain, this requires a different setup.

Requirements:

- The dashboard Vite config must use `base: '/dashboard/'`
- The existing main Nginx site must include a `/dashboard/` location block

Example Nginx snippet for the existing main site:

```nginx
location /dashboard/ {
    alias /var/www/dashboard/GreenTvDashboard/;
    try_files $uri $uri/ /dashboard/index.html;
}

location /dashboard/assets/ {
    alias /var/www/dashboard/GreenTvDashboard/assets/;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

The subdomain approach is preferred because it is cleaner and avoids changing the main website routing.

## 11. Final Recommended Production Layout

1. Main website: `www.thegreentv.com`
2. Dashboard frontend: `dashboard.thegreentv.com`
3. Backend API: `www.thegreentv.com/api/v1`
