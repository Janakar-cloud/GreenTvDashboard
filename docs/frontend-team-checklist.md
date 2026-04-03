# Frontend Team Checklist

Share this with the frontend repo team before the next release.

---

## 1. API Migration (Must Update Now)

The following endpoints have changed. Update every call site in the frontend.

| Old endpoint | New endpoint |
|---|---|
| `GET /api/v1/videos` | `GET /api/v1/media?menu=LiveTv&mediaType=video&status=published` |
| `GET /api/v1/podcasts` | `GET /api/v1/media?menu=Podcast&mediaType=audio&status=published` |
| `GET /api/v1/api/categories?type=media` | `GET /api/v1/categories?type=media` |

> **Note on the categories fix:** The old path contained a double `/api/v1/api/` prefix. If your `axios` / `fetch` base URL already includes `/api/v1`, the correct relative path is just `/categories?type=media`.

> **Note on media categories (dashboard-specific):** The dashboard currently fetches media categories via `GET /api/v1/media/categories` (the `getMediaCategories` function in `src/api/media.ts`). If the backend exposes `/categories?type=media` as the canonical path, update `getMediaCategories` to call that instead — or switch the component to use `getCategories('media')` from `src/api/reference.ts` which already uses the correct path.

---

## 2. Response Shape Change

The unified media endpoint returns a paginated wrapper. **Read `response.data.data`**, not the old flat array.

```ts
// Old shape (videos / podcasts)
const items = response.data; // array directly

// New shape (media endpoint)
const { data, meta } = response.data;
// data  → array of media items
// meta  → { total, page, limit, totalPages }
```

Update every place that previously accessed `response.data` (or `response.items`, `response.videos`, etc.) to `response.data.data`.

---

## 3. Auth Bootstrap

After a successful login — and on every app load when a token is present — call:

```
GET /api/v1/auth/me
Authorization: Bearer <token>
```

Use the returned user object to hydrate the auth store / context. Do **not** rely on locally cached user data between sessions without refreshing from this endpoint.

---

## 4. Environment Variables

Add or update these in `.env.production` (and `.env.local` for local dev):

```env
# Required — keep relative so Nginx proxy handles routing
VITE_API_BASE_URL=/api/v1

# Required only if the frontend links to or embeds the dashboard
VITE_DASHBOARD_URL=https://dashboard.thegreentv.com
```

> Using `VITE_API_BASE_URL=/api/v1` (relative path) keeps requests same-origin and lets the Nginx proxy forward them to the backend. Do **not** hardcode `http://localhost:4000` or the raw EC2 IP in production.

> **Dashboard repo note:** The `src/api/client.ts` file reads `import.meta.env.VITE_API_BASE_URL`. Make sure `.env.production` uses exactly that key (it does — verified). The old key `VITE_API_URL` has been retired.

---

## 5. Deployment

1. Always build before deploying:
   ```bash
   npm run build
   ```
2. Deploy only the contents of the `dist/` folder — never point the Nginx `root` at the source repo directory.
3. Serve `index.html` as the fallback for all routes (SPA routing):
   ```nginx
   location / {
       try_files $uri $uri/ /index.html;
   }
   ```
4. Do **not** run `vite dev` or `vite preview` in production.

---

## Quick Verification After Deploy

```bash
# Dashboard loads
curl -I https://dashboard.thegreentv.com

# API proxy is working
curl -I https://dashboard.thegreentv.com/api/v1/home

# Check Nginx logs if anything fails
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```
