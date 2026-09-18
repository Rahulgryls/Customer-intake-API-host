require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");
const { customers, siebelIndex, riskProfiles, transactions, exitedCustomer, sanctionsBlockedCustomer, prospectNoRatingCustomer } = require("./data/mockData");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEYS = (process.env.API_KEYS || "demo-key-123").split(",").map(k => k.trim());

app.use(helmet());
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

// --- API key auth (skip for /docs, /openapi.json, /health) ---
app.use((req, res, next) => {
  if (req.path.startsWith("/docs") || req.path === "/openapi.json" || req.path === "/health") return next();
  const key = req.header("X-API-Key");
  if (!key || !API_KEYS.includes(key)) {
    return res.status(401).json(errorBody(req, 401, "AUTH-1401", "Unauthorized", "Missing or invalid X-API-Key header", "header.X-API-Key"));
  }
  next();
});

app.get("/health", (req, res) => res.json({ status: "UP", timestamp: new Date().toISOString() }));

// --- API-01: Fetch Customer Details ---
app.get("/customer-intake/v1/customers/:id", (req, res) => {
  const { id } = req.params;
  const idType = req.query.idType || "RABO_CUSTOMER_ID";
  let customerId = id;
  if (idType === "SIEBEL_ID") customerId = siebelIndex[id];

  if (customerId === exitedCustomer.id) {
    return res.status(422).json(errorBody(req, 422, "CIN-1422", "Customer status does not permit intake",
      `Customer relationship ended on ${exitedCustomer.exitedOn} (status EXITED); credit report intake is not permitted`, "customer.customerStatus"));
  }
  const customer = customers[customerId];
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
  const profile = riskProfiles[customerId];
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
  const data = transactions[customerId];
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

// --- Swagger UI ---
const openapiDoc = YAML.load(path.join(__dirname, "openapi.yaml"));
app.get("/openapi.json", (req, res) => res.json(openapiDoc));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDoc, { customSiteTitle: "Customer Intake API Docs" }));

// --- 404 fallback ---
app.use((req, res) => res.status(404).json(errorBody(req, 404, "GEN-0404", "Not found", "No matching route", "path")));

app.listen(PORT, () => console.log(`Customer Intake API listening on :${PORT} | docs at /docs`));
