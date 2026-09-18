# Customer Intake API Suite

Mock host for the three Customer Intake APIs (Customer Details, Risk Profile, Transaction History)
with realistic fictitious data and Swagger docs, so your main app can integrate against a stable contract.

## Run
```
npm install
cp .env.example .env   # set BASIC_AUTH_USERS
npm start
```
Docs: `http://<host>:3000/docs` · Spec JSON: `/openapi.json` · Health: `/health`

## Auth
Every API call (not /docs, /openapi.json, /health) requires **HTTP Basic Auth** (username + password).
Configure valid pairs via `BASIC_AUTH_USERS` env var, format `user1:pass1,user2:pass2` — give each consuming
app its own pair. Default (change before going live): `demo:demo123`.

To call from another app: send an `Authorization: Basic <base64(user:pass)>` header, or just pass
`user:pass@` in the URL / use your HTTP client's basic-auth option (curl: `-u user:pass`).
In Swagger UI, click "Authorize" and enter the username/password directly.

## Endpoints
- `GET /customer-intake/v1/customers/{id}?idType=RABO_CUSTOMER_ID|SIEBEL_ID`
- `GET /customer-intake/v1/customers/{customerId}/risk-profile`
- `GET /customer-intake/v1/customers/{customerId}/transactions?dateFrom&dateTo&iban&pageNumber&pageSize`

Sample IDs: `110023456` (org, happy), `110034567` (person, happy), `110045678` (org, watchlist/warnings),
`999999999` (404), `110067890` (422 exited), `110056789` (423 sanctions block, risk-profile only),
`110078901` (404 no rating, risk-profile only).

## Live deployment notes
- Put behind a reverse proxy (Nginx/Caddy) with TLS; app listens on `PORT` (default 3000).
- Run under a process manager: `pm2 start server.js --name customer-intake-api` (or a systemd unit / Docker).
- `helmet`, CORS and a 120 req/min per-IP rate limit are already on; tighten `cors()` origins for production.
- Swap Basic Auth for your real gateway/OAuth if this sits behind Rabobank's API Gateway/ESB.
- Data is in-memory mock data (`data/mockData.js`) — no DB required.

## Free-tier "always-on" reality check
No free host is truly always-on with zero cold start (Render, Koyeb, etc. all scale to zero after
15-60 min idle and take 30-60s to wake). The standard free workaround: point a free uptime monitor
(UptimeRobot, cron-job.org) at `/health` every 5-10 minutes to keep the instance warm.

## Admin portal
Live at `/admin` (same Basic Auth as the API). Two tabs:
- **Manage APIs** — create a brand-new *mock/stub* API on the fly: give it a name, an optional description,
  and an optional sample JSON response. The app creates a generic endpoint at
  `/customer-intake/v1/mock/{your-api-slug}` that stores and returns whatever JSON you put in it (list, get,
  create/update, delete — by record id), and adds it to the Swagger docs automatically. This is deliberately
  a dumb store-and-return stub, not a real business API: it does not add validation, status-code rules, or
  filtering logic like the three built-in APIs have. If a mock API later needs real business rules, that
  still means writing a proper route by hand (same pattern as Customer Details / Risk Profile / Transactions).
- **Manage Data** — a folder-tree file browser (master folder → one folder per API → JSON records inside)
  covering both the built-in APIs and anything created in Manage APIs. Open, edit (with a linted JSON editor),
  upload, download, or delete any record.

Everything the admin portal creates or edits (custom APIs, their data, and edits to the built-in seed data)
lives on this server's local disk — same as the rest of this app's data. It survives normal restarts but
resets on a fresh deploy (git push) unless a persistent volume or real database is added. Treat it as
POC/demo storage: download anything you want to keep before redeploying.

## Persistence: GitHub as the durable backing store
By default, everything (built-in seed data, custom APIs, uploaded files) lives on the server's local disk,
which is fast but **ephemeral** - it resets to seed data on every redeploy. Setting these three environment
variables turns on automatic GitHub-backed persistence instead:
- `GITHUB_TOKEN` — a GitHub personal access token with **contents: write** access to this repo only
  (a fine-grained PAT scoped to just this repository is safest).
- `GITHUB_REPO` — `owner/repo`, e.g. `Rahulgryls/Customer-intake-API-host`.
- `GITHUB_BRANCH` (optional, defaults to `main`).

Once configured: every save, delete, rename, API creation and API deletion is automatically mirrored in the
background into this repo under `data/committed/{category}/{id}.json` (and the API registry at
`data/committed/_registry/apiRegistry.json`) - no button to click, it just happens. On every server startup,
the app pulls everything back down from `data/committed/` in GitHub **before** it starts serving traffic, so
a redeploy no longer means lost data. Without these env vars set, the app behaves exactly as before (local
disk only, resets on redeploy) - nothing else changes.

**Rename** (Manage Data tab) — change a file's ID in place (e.g. turn `sample.json` into something meaningful
like `1012ab-15.json`) without re-uploading or losing edits; this is treated as a write+delete, so it syncs to
GitHub automatically too when persistence is on.

**Re-sync to GitHub** (Manage Data tab) — a manual button to force one file to sync again right now, useful
if you suspect a background sync failed (check the server logs for `[sync] background GitHub sync failed...`
lines) - not the primary mechanism, since syncing is automatic once configured.

**Security note:** once GitHub persistence is configured, the token is core to how the app stays durable, and
anyone with a valid admin Basic Auth credential can trigger commits to this repo (scoped only to the
`data/committed/` folder, never your app code). Treat every admin credential as more sensitive once this is
on, and rotate the token periodically.

**Trade-offs to know about:** each save now does a network round-trip to GitHub in the background (a second
or two, not blocking the caller's response); the repo's commit history grows with every edit anyone makes;
GitHub's API allows 5,000 requests/hour per token, which is generous for a small team but not unlimited.

## Multiple people using the admin portal
Give each teammate their own entry in `BASIC_AUTH_USERS` (e.g. `demo:demo123,alex:alexpass456`) instead of
sharing one password — the admin portal now tracks who created each custom API and shows "Signed in as
{username}" in the header. Anyone can create a new mock API; deleting one is restricted to whoever created
it, plus anyone listed in `ADMIN_USERS` (defaults to the first username in `BASIC_AUTH_USERS` if unset).
Editing the JSON files inside an API's folder stays open to everyone with a valid credential — this is a
lightweight team-sandbox permission model (stop accidental deletes), not a full multi-tenant access-control
system. If this needs to support genuinely public/untrusted signup later, that's a bigger redesign (real
accounts, quotas, a real database) rather than an extension of this.
