# Dashboard Frontend Deployment Guide

This document explains how the frontend team should deploy the separate dashboard frontend repository on the same EC2 server that already runs the main website and API.

## Target Setup

- Main site: `https://www.thegreentv.com`
- Dashboard frontend: `https://dashboard.thegreentv.com`
- Backend API: proxied by Nginx to `http://127.0.0.1:4000`

This guide assumes:

- The backend API from this repository is already running on the EC2 server
- Nginx is already installed on the EC2 server
- Ubuntu user is `ubuntu`

> **Two-folder model — important.**
> There are always two separate folders in this setup:
>
> | Folder | Purpose |
> |---|---|
> | `~/dashboard/GreenTvDashboard` | Source repo — `git pull` and `npm run build` happen here |
> | `/var/www/dashboard/GreenTvDashboard` | Web root — only the built `dist/` contents go here, served by Nginx |
>
> Never run `git pull` in the web root. Never point Nginx at the source repo.

## Why This Setup

Use a separate subdomain for the dashboard instead of another `server_name _;` block or mixing the dashboard into the main site root. This avoids Nginx conflicts and keeps the dashboard isolated from the public website.

## 1. DNS

Create an `A` record:

```txt
dashboard.thegreentv.com -> 13.205.72.30
```

Wait until DNS resolves before requesting the SSL certificate.

## 2. Prepare Both Directories

Create the **web root** (static files only, served by Nginx):

```bash
sudo mkdir -p /var/www/dashboard/GreenTvDashboard
sudo chown -R ubuntu:ubuntu /var/www/dashboard
```

Clone the **source repo** (if not already present):

```bash
mkdir -p ~/dashboard
git clone -b Backend https://github.com/murali091988/GreenTvDashboard.git ~/dashboard/GreenTvDashboard
```

If the source repo already exists, just pull:

```bash
cd ~/dashboard/GreenTvDashboard
git pull origin Backend
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

For every new dashboard release, always work from the **source repo**, not the web root:

```bash
# 1. Update source repo
cd ~/dashboard/GreenTvDashboard
git pull origin Backend

# 2. Install and build
npm ci
npm run build

# 3. Deploy built files to web root
rsync -av --delete dist/ /var/www/dashboard/GreenTvDashboard/

# 4. Confirm Nginx config is still valid and reload
sudo nginx -t
sudo systemctl reload nginx
```

> Quick check: `/var/www/dashboard/GreenTvDashboard/` should contain `index.html` and an `assets/` folder — never `main.tsx`, `package.json`, or a `.git` directory.

## 8a. Recovery: Web Root Accidentally Contains Source Files or Has No .git

If you see `git pull` failing in `/var/www/dashboard/GreenTvDashboard/` or that folder contains source files (`src/`, `package.json`, etc.) instead of only built output, follow these steps:

**Step 1 — Set up the correct source repo location:**

```bash
mkdir -p ~/dashboard
# Only if ~/dashboard/GreenTvDashboard does not already exist:
git clone -b Backend https://github.com/murali091988/GreenTvDashboard.git ~/dashboard/GreenTvDashboard
# If it already exists:
# cd ~/dashboard/GreenTvDashboard && git pull origin Backend
```

**Step 2 — Create the env file and build:**

```bash
cd ~/dashboard/GreenTvDashboard
cat > .env.production <<'EOF'
VITE_API_BASE_URL=/api/v1
EOF
npm ci
npm run build
```

**Step 3 — Wipe and re-deploy the web root:**

```bash
rm -rf /var/www/dashboard/GreenTvDashboard/*
rsync -av dist/ /var/www/dashboard/GreenTvDashboard/
```

**Step 4 — Confirm Nginx root is correct:**

The Nginx config must have:

```nginx
root /var/www/dashboard/GreenTvDashboard;
```

Verify and reload:

```bash
grep -n 'root' /etc/nginx/sites-available/greentv-dashboard
sudo nginx -t
sudo systemctl reload nginx
```

**Step 5 — Verify:**

```bash
ls /var/www/dashboard/GreenTvDashboard/
# Expected: assets/  index.html
# Must NOT contain: src/  main.tsx  package.json  .git

curl -I https://dashboard.thegreentv.com
curl -I https://dashboard.thegreentv.com/api/v1/home
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
