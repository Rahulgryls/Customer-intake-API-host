# Customer Intake API Suite

Mock host for the three Customer Intake APIs (Customer Details, Risk Profile, Transaction History)
with realistic fictitious data and Swagger docs, so your main app can integrate against a stable contract.

## Run
```
npm install
cp .env.example .env   # set API_KEYS
npm start
```
Docs: `http://<host>:3000/docs` · Spec JSON: `/openapi.json` · Health: `/health`

## Auth
Every API call (not /docs, /openapi.json, /health) requires header `X-API-Key`.
Configure valid keys via `API_KEYS` env var (comma-separated). Rotate per consuming app.

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
- Swap the `X-API-Key` check for your real gateway/OAuth if this sits behind Rabobank's API Gateway/ESB.
- Data is in-memory mock data (`data/mockData.js`) — no DB required.
