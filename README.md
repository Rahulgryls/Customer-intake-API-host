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

## File rename & "Commit to GitHub" (Manage Data tab)
- **Rename** — change a file's ID in place (e.g. turn `sample.json` into something meaningful like
  `1012ab-15.json`) without re-uploading or losing edits.
- **Commit to GitHub** — writes the currently-open file into this repo at `data/committed/{category}/{id}.json`
  via the GitHub API, so that one file survives a redeploy (everything else in `data/files/` still resets, as
  described above — this button snapshots one file at a time on purpose, it isn't automatic persistence).
  Requires two environment variables on the server:
  - `GITHUB_TOKEN` — a GitHub personal access token with **contents: write** access to this repo only
    (a fine-grained PAT scoped to just this repository is safest).
  - `GITHUB_REPO` — `owner/repo`, e.g. `Rahulgryls/Customer-intake-API-host`.
  - `GITHUB_BRANCH` (optional, defaults to `main`).

  Without these set, the button just replies that GitHub commit isn't configured — nothing else in the app
  is affected. **Security note:** once configured, anyone with the admin Basic Auth credential can trigger a
  real commit to this GitHub repo (scoped only to the `data/committed/` folder, never your app code) — treat
  that credential as more sensitive once this is turned on, and rotate it periodically.

## Multiple people using the admin portal
Give each teammate their own entry in `BASIC_AUTH_USERS` (e.g. `demo:demo123,alex:alexpass456`) instead of
sharing one password — the admin portal now tracks who created each custom API and shows "Signed in as
{username}" in the header. Anyone can create a new mock API; deleting one is restricted to whoever created
it, plus anyone listed in `ADMIN_USERS` (defaults to the first username in `BASIC_AUTH_USERS` if unset).
Editing the JSON files inside an API's folder stays open to everyone with a valid credential — this is a
lightweight team-sandbox permission model (stop accidental deletes), not a full multi-tenant access-control
system. If this needs to support genuinely public/untrusted signup later, that's a bigger redesign (real
accounts, quotas, a real database) rather than an extension of this.
