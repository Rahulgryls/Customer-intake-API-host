require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");
const store = require("./data/dataStore");
const { exitedCustomer, sanctionsBlockedCustomer, prospectNoRatingCustomer } = require("./data/mockData");

const app = express();
const PORT = process.env.PORT || 3000;
// BASIC_AUTH_USERS format: "user1:pass1,user2:pass2" - give each person/team their own pair
// so "who created this API" means something real, not just a shared secret everyone types.
const CREDENTIALS = (process.env.BASIC_AUTH_USERS || "demo:demo123")
  .split(",").map(pair => pair.trim().split(":")).filter(p => p.length === 2);

// ADMIN_USERS: usernames (from the list above) allowed to manage/delete ANY custom API,
// not just their own. Defaults to just the first username if unset, so by default only
// the primary account is an admin and everyone else can only manage what they created.
const ADMIN_USERS = (process.env.ADMIN_USERS || (CREDENTIALS[0] ? CREDENTIALS[0][0] : ""))
  .split(",").map(u => u.trim()).filter(Boolean);
function isAdmin(username) { return ADMIN_USERS.includes(username); }

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // admin portal loads CodeMirror from cdnjs; Swagger UI needs its own inline init script
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https:"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "data:", "https:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  }
}));
app.use(cors());
app.use(express.json());
app.set("trust proxy", 1);
app.use(rateLimit({ windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false }));

// --- error envelope helper ---
function errorBody(req, status, code, title, detail, source) {
  return {
    status, correlationId: req.header("X-Correlation-ID") || "n/a",
    timestamp: new Date().toISOString(), path: req.originalUrl,
    errors: [{ code, title, detail, severity: "ERROR", source }]
  };
}

function messageHeader(req, sourceSystem) {
  return {
    correlationId: req.header("X-Correlation-ID") || "n/a",
    timestamp: new Date().toISOString(), sourceSystem, apiVersion: "1.0.0"
  };
}

// --- HTTP Basic Auth (username/password) - skip for /docs, /openapi.json, /health ---
app.use((req, res, next) => {
  if (req.path.startsWith("/docs") || req.path === "/openapi.json" || req.path === "/health") return next();

  const header = req.header("Authorization") || "";
  const [scheme, encoded] = header.split(" ");
  let user, pass;
  if (scheme === "Basic" && encoded) {
    try { [user, pass] = Buffer.from(encoded, "base64").toString("utf8").split(":"); } catch { /* fall through */ }
  }
  const match = CREDENTIALS.find(([u, p]) => u === user && p === pass);
  if (!match) {
    res.set("WWW-Authenticate", 'Basic realm="Customer Intake API"');
    return res.status(401).json(errorBody(req, 401, "AUTH-1401", "Unauthorized", "Missing or invalid username/password (HTTP Basic Auth required)", "header.Authorization"));
  }
  req.user = match[0];
  next();
});

app.get("/health", (req, res) => res.json({ status: "UP", timestamp: new Date().toISOString() }));

// Lets the admin portal show "you" and whether you have admin rights, without exposing
// anyone else's credentials.
app.get("/admin/api/whoami", (req, res) => res.json({ username: req.user, isAdmin: isAdmin(req.user) }));

// --- API-01: Fetch Customer Details ---
app.get("/customer-intake/v1/customers/:id", (req, res) => {
  const { id } = req.params;
  const idType = req.query.idType || "RABO_CUSTOMER_ID";
  let customerId = id;
  if (idType === "SIEBEL_ID") customerId = store.siebelIndex[id];

  if (customerId === exitedCustomer.id) {
    return res.status(422).json(errorBody(req, 422, "CIN-1422", "Customer status does not permit intake",
      `Customer relationship ended on ${exitedCustomer.exitedOn} (status EXITED); credit report intake is not permitted`, "customer.customerStatus"));
  }
  const customer = store.customers[customerId];
  if (!customer) {
    return res.status(404).json(errorBody(req, 404, "CIN-1404", "Customer not found",
      `No active party found for identifier ${id} (idType=${idType})`, "path.id"));
  }
  res.json({ messageHeader: messageHeader(req, "SIEBEL-CRM"), customer });
});

// --- API-02: Fetch Customer Risk Profile ---
app.get("/customer-intake/v1/customers/:customerId/risk-profile", (req, res) => {
  const { customerId } = req.params;
  if (customerId === sanctionsBlockedCustomer.id) {
    return res.status(423).json(errorBody(req, 423, "CIN-2423", "Risk profile access blocked",
      "Confirmed sanctions screening match; credit report initiation prohibited. Refer to Financial Crime Compliance", "amlRiskProfile.sanctionsScreeningResult"));
  }
  if (customerId === prospectNoRatingCustomer.id) {
    return res.status(404).json(errorBody(req, 404, "CIN-2404", "Risk profile not available",
      `No rating exists for customer ${customerId}; initial rating pending CDD completion`, "path.customerId"));
  }
  const profile = store.riskProfiles[customerId];
  if (!profile) {
    return res.status(404).json(errorBody(req, 404, "CIN-2404", "Risk profile not available",
      `No rating exists for customer ${customerId}`, "path.customerId"));
  }
  res.json({ messageHeader: messageHeader(req, "RISK-ENGINE"), ...profile });
});

// --- API-03: Fetch Transaction History ---
app.get("/customer-intake/v1/customers/:customerId/transactions", (req, res) => {
  const { customerId } = req.params;
  const { dateFrom, dateTo, iban, bookingStatus, pageNumber = 1, pageSize = 200 } = req.query;
  const data = store.transactions[customerId];
  if (!data) {
    return res.status(404).json(errorBody(req, 404, "CIN-3404", "Transaction history not available",
      `No transaction data found for customer ${customerId}`, "path.customerId"));
  }
  let accounts = data.accounts;
  if (iban) accounts = accounts.filter(a => a.iban === iban);

  res.json({
    messageHeader: messageHeader(req, "PAYMENTS-HUB"),
    customerId,
    retrievalPeriod: { dateFrom: dateFrom || "n/a", dateTo: dateTo || "n/a" },
    pagination: { pageNumber: Number(pageNumber), pageSize: Number(pageSize), totalPages: 1, totalRecords: accounts.reduce((s, a) => s + a.transactions.length, 0), hasMore: false },
    accounts,
    aggregates: data.aggregates
  });
});

// --- Admin portal: a simple file manager over the underlying mock data ---
// Every record is a real .json file under data/files/<category>/<id>.json.
// Protected by the same Basic Auth as the rest of the API (see middleware above).
app.get("/admin", (req, res) => res.sendFile(path.join(__dirname, "public", "admin.html")));

function validCategory(req, res) {
  const { category } = req.params;
  if (!store.CATEGORIES.includes(category)) {
    res.status(400).json(errorBody(req, 400, "ADM-0400", "Unknown category", `category must be one of: ${store.CATEGORIES.join(", ")}`, "path.category"));
    return null;
  }
  return category;
}

// List files, optionally filtered by ?category=
app.get("/admin/api/files", (req, res) => {
  const cats = req.query.category ? [req.query.category] : store.CATEGORIES;
  const files = cats.filter(c => store.CATEGORIES.includes(c)).flatMap(c => store.listFiles(c));
  res.json({ files });
});

// Read one file's raw JSON content (also used for download)
app.get("/admin/api/files/:category/:id", (req, res) => {
  const category = validCategory(req, res);
  if (!category) return;
  const raw = store.readFileRaw(category, req.params.id);
  if (raw === null) {
    return res.status(404).json(errorBody(req, 404, "ADM-0404", "File not found", `${category}/${req.params.id}.json does not exist`, "path"));
  }
  res.set("Content-Type", "application/json");
  if (req.query.download === "true") res.set("Content-Disposition", `attachment; filename="${req.params.id}.json"`);
  res.send(raw);
});

// Create or update (also how uploads land: client reads the uploaded file, then PUTs its parsed content)
app.put("/admin/api/files/:category/:id", (req, res) => {
  const category = validCategory(req, res);
  if (!category) return;
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json(errorBody(req, 400, "ADM-0400", "Invalid body", "Request body must be a JSON object", "body"));
  }
  store.writeFile(category, req.params.id, req.body);
  res.json({ status: "ok", category, id: req.params.id });
});

app.delete("/admin/api/files/:category/:id", (req, res) => {
  const category = validCategory(req, res);
  if (!category) return;
  store.deleteFile(category, req.params.id);
  res.json({ status: "ok", category, id: req.params.id });
});

// Rename a file's id in place (e.g. sample.json -> 1012ab-15.json)
app.post("/admin/api/files/:category/:id/rename", (req, res) => {
  const category = validCategory(req, res);
  if (!category) return;
  const newId = (req.body && req.body.newId ? String(req.body.newId) : "").trim();
  if (!newId) {
    return res.status(400).json(errorBody(req, 400, "ADM-0400", "Missing newId", "Provide newId in the request body", "body.newId"));
  }
  try {
    store.renameFile(category, req.params.id, newId);
    res.json({ status: "ok", category, oldId: req.params.id, newId });
  } catch (e) {
    if (e instanceof store.ApiError) {
      return res.status(e.status).json(errorBody(req, e.status, "ADM-RENAME-" + e.status, "Could not rename file", e.message, "body.newId"));
    }
    res.status(500).json(errorBody(req, 500, "ADM-RENAME-500", "Unexpected error", e.message, "body.newId"));
  }
});

// --- GitHub persistence ---
// When GITHUB_TOKEN + GITHUB_REPO are configured (see data/github.js), every write/delete
// below is mirrored into data/committed/{category}/{id}.json in the repo automatically in
// the background (see the change listener registered in bootstrap() at the bottom of this
// file), and the whole dataset is restored from GitHub on startup before the app starts
// serving traffic. This endpoint is a manual "sync this one file again right now" button -
// useful if you suspect a background sync failed - not the primary persistence mechanism.
const github = require("./data/github");

app.post("/admin/api/files/:category/:id/commit", async (req, res) => {
  const category = validCategory(req, res);
  if (!category) return;
  if (!github.isConfigured()) {
    return res.status(501).json(errorBody(req, 501, "ADM-GH-501", "GitHub persistence not configured",
      "Set GITHUB_TOKEN and GITHUB_REPO environment variables on the server to enable this", "env"));
  }
  const raw = store.readFileRaw(category, req.params.id);
  if (raw === null) {
    return res.status(404).json(errorBody(req, 404, "ADM-0404", "File not found", `${category}/${req.params.id}.json does not exist`, "path"));
  }
  const repoPath = `data/committed/${category}/${req.params.id}.json`;
  const result = await github.putFile(repoPath, raw, `Admin portal: manual re-sync of ${category}/${req.params.id}.json`);
  if (!result.ok) {
    return res.status(502).json(errorBody(req, 502, "ADM-GH-502", "GitHub sync failed", result.error, "github"));
  }
  res.json({ status: "ok", path: repoPath, htmlUrl: result.htmlUrl });
});

// --- Admin: API registry (create/list/delete custom mock APIs) ---
app.get("/admin/api/apis", (req, res) => {
  const apis = store.listApis().map(a => ({
    ...a,
    fileCount: store.listFiles(a.slug).length,
    endpoint: `/customer-intake/v1/mock/${a.slug}`
  }));
  res.json({ apis, builtIn: store.BUILTIN_CATEGORIES });
});

app.post("/admin/api/apis", (req, res) => {
  try {
    const { name, description, team, contact, tags, sampleResponse, sampleRequest } = req.body || {};
    const entry = store.createApi({ name, description, team, contact, tags, sampleResponse, sampleRequest, createdBy: req.user });
    res.status(201).json({ ...entry, endpoint: `/customer-intake/v1/mock/${entry.slug}` });
  } catch (e) {
    if (e instanceof store.ApiError) {
      return res.status(e.status).json(errorBody(req, e.status, "ADM-API-" + e.status, "Could not create API", e.message, "body"));
    }
    res.status(500).json(errorBody(req, 500, "ADM-API-500", "Unexpected error", e.message, "body"));
  }
});

app.delete("/admin/api/apis/:slug", (req, res) => {
  try {
    const entry = store.listApis().find(a => a.slug === req.params.slug);
    if (entry && entry.createdBy && entry.createdBy !== req.user && !isAdmin(req.user)) {
      return res.status(403).json(errorBody(req, 403, "ADM-API-403", "Not allowed",
        `Only "${entry.createdBy}" (who created this API) or an admin can delete it`, "path.slug"));
    }
    const ok = store.deleteApi(req.params.slug);
    if (!ok) return res.status(404).json(errorBody(req, 404, "ADM-API-404", "API not found", `No custom API named ${req.params.slug}`, "path.slug"));
    res.json({ status: "ok", slug: req.params.slug });
  } catch (e) {
    if (e instanceof store.ApiError) {
      return res.status(e.status).json(errorBody(req, e.status, "ADM-API-" + e.status, "Could not delete API", e.message, "path.slug"));
    }
    res.status(500).json(errorBody(req, 500, "ADM-API-500", "Unexpected error", e.message, "path.slug"));
  }
});

// --- Generic mock endpoint: serves whatever JSON is stored for a custom API ---
// This is deliberately dumb (store/retrieve JSON, no business rules) - see README.
function customApiOr404(req, res) {
  const { apiSlug } = req.params;
  const known = store.listApis().some(a => a.slug === apiSlug);
  if (!known) {
    res.status(404).json(errorBody(req, 404, "MOCK-0404", "Unknown mock API", `No custom API registered as "${apiSlug}" — create it in the admin portal first`, "path.apiSlug"));
    return false;
  }
  return true;
}

// Reserved key: a stored stub record may include a top-level "__status" field
// (e.g. "__status": 422) to make GET-by-id for that record return that HTTP
// status instead of 200 - lets teams simulate error paths, not just happy-path
// 200s. Stripped out of the response body; the status code drives res.status().
function splitStubStatus(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return { status: 200, body: record };
  const { __status, ...body } = record;
  const status = Number.isInteger(__status) && __status >= 100 && __status <= 599 ? __status : 200;
  return { status, body };
}

app.get("/customer-intake/v1/mock/:apiSlug", (req, res) => {
  if (!customApiOr404(req, res)) return;
  const records = store.listFiles(req.params.apiSlug).map(f => {
    const { status, body } = splitStubStatus(JSON.parse(store.readFileRaw(f.category, f.id)));
    return { id: f.id, statusCode: status, body };
  });
  res.json({ messageHeader: messageHeader(req, "MOCK-STUB"), apiSlug: req.params.apiSlug, count: records.length, records });
});

app.get("/customer-intake/v1/mock/:apiSlug/:id", (req, res) => {
  if (!customApiOr404(req, res)) return;
  const raw = store.readFileRaw(req.params.apiSlug, req.params.id);
  if (raw === null) {
    return res.status(404).json(errorBody(req, 404, "MOCK-0404", "Record not found", `No stub record ${req.params.id} for API ${req.params.apiSlug}`, "path.id"));
  }
  const { status, body } = splitStubStatus(JSON.parse(raw));
  res.status(status).json(body);
});

app.put("/customer-intake/v1/mock/:apiSlug/:id", (req, res) => {
  if (!customApiOr404(req, res)) return;
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json(errorBody(req, 400, "MOCK-0400", "Invalid body", "Request body must be a JSON object", "body"));
  }
  store.writeFile(req.params.apiSlug, req.params.id, req.body);
  res.json({ status: "ok", apiSlug: req.params.apiSlug, id: req.params.id });
});

app.delete("/customer-intake/v1/mock/:apiSlug/:id", (req, res) => {
  if (!customApiOr404(req, res)) return;
  store.deleteFile(req.params.apiSlug, req.params.id);
  res.json({ status: "ok", apiSlug: req.params.apiSlug, id: req.params.id });
});

// --- Swagger UI (dynamic: custom mock APIs are merged in on every request, so
// creating a new API through the portal shows up in Swagger with no redeploy) ---
const baseOpenapiDoc = YAML.load(path.join(__dirname, "openapi.yaml"));

function inferSchema(value) {
  if (value === null || value === undefined) return { type: "string", nullable: true };
  if (Array.isArray(value)) return { type: "array", items: value.length ? inferSchema(value[0]) : {} };
  switch (typeof value) {
    case "number": return { type: Number.isInteger(value) ? "integer" : "number" };
    case "boolean": return { type: "boolean" };
    case "object": {
      const properties = {};
      for (const [k, v] of Object.entries(value)) properties[k] = inferSchema(v);
      return { type: "object", properties };
    }
    default: return { type: "string" };
  }
}

const STUB_STATUS_TIP = 'Tip: any stored record may include a top-level "__status" field ' +
  '(e.g. "__status": 422) to make GET-by-id return that HTTP status instead of 200 — ' +
  "simulate error paths, not just happy-path responses.";

function buildOpenApiDoc() {
  const doc = JSON.parse(JSON.stringify(baseOpenapiDoc));
  doc.paths = doc.paths || {};
  for (const api of store.listApis()) {
    const responseSchema = inferSchema(api.sampleResponse || { note: "no sample provided at creation time" });
    const requestSchema = inferSchema(api.sampleRequest || api.sampleResponse || { note: "no sample provided at creation time" });
    const owner = [api.team, api.contact].filter(Boolean).join(" — ");
    const tagLine = api.tags && api.tags.length ? `Tags: ${api.tags.join(", ")}.` : "";
    const fullDescription = [api.description, owner && `Owned by: ${owner}.`, tagLine, STUB_STATUS_TIP].filter(Boolean).join(" ");
    const base = `/customer-intake/v1/mock/${api.slug}`;
    doc.paths[base] = {
      get: {
        summary: `List ${api.displayName} mock records`, tags: ["Custom Mock APIs (stubs)"],
        description: fullDescription,
        responses: { 200: { description: "OK", content: { "application/json": { schema: { type: "object", properties: { count: { type: "integer" }, records: { type: "array", items: { type: "object", properties: { id: { type: "string" }, statusCode: { type: "integer" }, body: responseSchema } } } } } } } } }
      }
    };
    doc.paths[`${base}/{id}`] = {
      get: {
        summary: `Get one ${api.displayName} mock record`, tags: ["Custom Mock APIs (stubs)"],
        description: fullDescription,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "OK (or whatever status the record's __status specifies)", content: { "application/json": { schema: responseSchema } } }, 404: { description: "Not found" } }
      },
      put: {
        summary: `Create/update a ${api.displayName} mock record`, tags: ["Custom Mock APIs (stubs)"],
        description: fullDescription,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: requestSchema } } },
        responses: { 200: { description: "Saved" } }
      },
      delete: {
        summary: `Delete a ${api.displayName} mock record`, tags: ["Custom Mock APIs (stubs)"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Deleted" } }
      }
    };
  }
  return doc;
}

app.get("/openapi.json", (req, res) => res.json(buildOpenApiDoc()));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(null, { swaggerUrl: "/openapi.json", customSiteTitle: "Customer Intake API Docs" }));

// --- 404 fallback ---
app.use((req, res) => res.status(404).json(errorBody(req, 404, "GEN-0404", "Not found", "No matching route", "path")));

// --- Startup: rehydrate from GitHub (if configured) before seeding/serving, then wire
// up the background sync listener for everything that happens after that ---
async function bootstrap() {
  if (github.isConfigured()) {
    console.log("[bootstrap] GitHub persistence configured — restoring data/committed/ ...");
    const entries = await github.fetchSnapshot("data/committed/");
    const restored = store.restoreFromSnapshot(entries);
    console.log(`[bootstrap] restored ${restored} file(s) from GitHub`);
  } else {
    console.log("[bootstrap] GitHub persistence not configured — using local disk only (resets on redeploy)");
  }
  store.ensureSeeded();

  store.setChangeListener(async (event) => {
    if (!github.isConfigured()) return;
    if (event.type === "file") {
      const repoPath = `data/committed/${event.category}/${event.id}.json`;
      const result = event.content === null
        ? await github.deleteFile(repoPath, `Admin portal: delete ${event.category}/${event.id}.json`)
        : await github.putFile(repoPath, JSON.stringify(event.content, null, 2), `Admin portal: update ${event.category}/${event.id}.json`);
      if (!result.ok) console.error(`[sync] background GitHub sync failed for ${repoPath}:`, result.error);
    } else if (event.type === "registry") {
      const result = await github.putFile("data/committed/_registry/apiRegistry.json", store.registryRaw(), "Admin portal: update API registry");
      if (!result.ok) console.error("[sync] background GitHub sync failed for API registry:", result.error);
    }
  });

  app.listen(PORT, () => console.log(`Customer Intake API listening on :${PORT} | docs at /docs`));
}

bootstrap();
