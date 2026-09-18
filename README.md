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
