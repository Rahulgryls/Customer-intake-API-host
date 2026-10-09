// Connection details for every API this host serves — the "how do I actually call
// this?" metadata the admin portal renders per endpoint: absolute URL, method, path
// and query parameters (and which are required), headers, request body, status codes
// and a ready-to-paste curl command.
//
// Built-in APIs are described by hand here, because their behaviour lives in
// hand-coded routes in server.js and only a human can say which parameters really
// matter. Custom mock APIs are derived from their registry entry instead: they all
// share the same generic store-and-return shape, so their docs can be generated.
//
// Keep this file in sync with the routes in server.js — it is documentation, so a
// stale entry here is worse than none.
const store = require("./dataStore");

const MOCK_BASE = "/customer-intake/v1/mock";

// --- headers every call shares ---
function authHeader(username) {
  return {
    name: "Authorization",
    required: true,
    type: "string",
    example: `Basic base64(${username || "username"}:<password>)`,
    description:
      "HTTP Basic credentials. With curl use -u username:password; in Swagger UI click " +
      "Authorize; in Postman pick Auth type \"Basic Auth\". Every endpoint except " +
      "/health, /docs and /openapi.json requires it."
  };
}

const CORRELATION_HEADER = {
  name: "X-Correlation-ID",
  required: false,
  type: "string",
  example: "7f1c1b2e-9a44-4f0e-8a2d-11c0ffee1234",
  description:
    "Optional trace id. Echoed back as messageHeader.correlationId on success and as " +
    "correlationId in error bodies. Defaults to \"n/a\" when omitted."
};

const JSON_BODY_HEADER = {
  name: "Content-Type",
  required: true,
  type: "string",
  example: "application/json",
  description: "Required on requests that send a JSON body (PUT)."
};

const RATE_LIMIT_NOTE = "Rate limit: 120 requests per minute per IP (429 once exceeded).";

// --- built-in APIs (hand-coded routes in server.js) ---
const BUILTIN_APIS = [
  {
    slug: "customers",
    displayName: "API-01 Customer Details",
    description:
      "Unified party profile (organisation or person) as served by Siebel CRM: identification, " +
      "contact details, relationship, KYC and accounts.",
    sourceSystem: "SIEBEL-CRM",
    recordUrlTemplate: "/customer-intake/v1/customers/{recordId}",
    examples: [
      { id: "110023456", outcome: "200", note: "Organisation — De Groot Kaashandel B.V. (happy path)" },
      { id: "110034567", outcome: "200", note: "Person — Emma van den Berg (happy path)" },
      { id: "110045678", outcome: "200", note: "Organisation with watchlist warnings" },
      { id: "1-3K7P9Q", outcome: "200", note: "Same customer as 110023456, via idType=SIEBEL_ID" },
      { id: "110067890", outcome: "422", note: "Relationship ended (status EXITED) — intake not permitted" },
      { id: "999999999", outcome: "404", note: "Unknown customer" }
    ],
    operations: [
      {
        id: "get-customer",
        method: "GET",
        pathTemplate: "/customer-intake/v1/customers/{id}",
        summary: "Fetch one customer by identifier",
        pathParams: [
          {
            name: "id",
            required: true,
            type: "string",
            example: "110023456",
            description:
              "The customer identifier. Read as a Rabobank customer id by default, or as a " +
              "Siebel id when idType=SIEBEL_ID."
          }
        ],
        queryParams: [
          {
            name: "idType",
            required: false,
            type: "string",
            enum: ["RABO_CUSTOMER_ID", "SIEBEL_ID"],
            default: "RABO_CUSTOMER_ID",
            example: "RABO_CUSTOMER_ID",
            description: "How to interpret the id in the path. Omit it to use RABO_CUSTOMER_ID."
          }
        ],
        responses: [
          { status: 200, description: "Customer found — { messageHeader, customer }" },
          { status: 401, description: "Missing or wrong username/password (AUTH-1401)" },
          { status: 404, description: "No active party for this identifier (CIN-1404)" },
          { status: 422, description: "Customer status does not permit intake, e.g. EXITED (CIN-1422)" }
        ]
      }
    ]
  },
  {
    slug: "risk-profiles",
    displayName: "API-02 Customer Risk Profile",
    description:
      "Credit risk rating, regulatory classification, AML/KYC risk profile and bureau data " +
      "for one customer, as served by the Risk Engine.",
    sourceSystem: "RISK-ENGINE",
    recordUrlTemplate: "/customer-intake/v1/customers/{recordId}/risk-profile",
    examples: [
      { id: "110023456", outcome: "200", note: "Organisation risk profile (happy path)" },
      { id: "110034567", outcome: "200", note: "Person risk profile (happy path)" },
      { id: "110056789", outcome: "423", note: "Confirmed sanctions match — access blocked" },
      { id: "110078901", outcome: "404", note: "Prospect, initial rating still pending CDD" }
    ],
    operations: [
      {
        id: "get-risk-profile",
        method: "GET",
        pathTemplate: "/customer-intake/v1/customers/{customerId}/risk-profile",
        summary: "Fetch the risk profile for one customer",
        pathParams: [
          {
            name: "customerId",
            required: true,
            type: "string",
            example: "110023456",
            description: "Rabobank customer id. This endpoint does not accept Siebel ids."
          }
        ],
        queryParams: [],
        responses: [
          { status: 200, description: "Risk profile found — messageHeader plus the profile fields" },
          { status: 401, description: "Missing or wrong username/password (AUTH-1401)" },
          { status: 404, description: "No rating exists for this customer (CIN-2404)" },
          { status: 423, description: "Sanctions screening match — access prohibited (CIN-2423)" }
        ]
      }
    ]
  },
  {
    slug: "transactions",
    displayName: "API-03 Transaction History",
    description:
      "Booked transaction history and monthly aggregates per account, as served by the " +
      "Payments Hub.",
    sourceSystem: "PAYMENTS-HUB",
    recordUrlTemplate: "/customer-intake/v1/customers/{recordId}/transactions",
    examples: [
      { id: "110023456", outcome: "200", note: "Two accounts — NL62RABO0300065432, NL83RABO0117653450" },
      { id: "110034567", outcome: "200", note: "Two accounts — NL03RABO0345678901, NL72RABO0139876542" },
      { id: "110045678", outcome: "200", note: "One account — NL32RABO0187654321" },
      { id: "999999999", outcome: "404", note: "No transaction data for this customer" }
    ],
    operations: [
      {
        id: "get-transactions",
        method: "GET",
        pathTemplate: "/customer-intake/v1/customers/{customerId}/transactions",
        summary: "Fetch transaction history for one customer",
        pathParams: [
          {
            name: "customerId",
            required: true,
            type: "string",
            example: "110023456",
            description: "Rabobank customer id."
          }
        ],
        queryParams: [
          {
            name: "iban",
            required: false,
            type: "string",
            example: "NL62RABO0300065432",
            description: "Return only this account. This filter is applied by the mock."
          },
          {
            name: "dateFrom",
            required: false,
            type: "string (date)",
            example: "2026-01-01",
            description:
              "Start of the retrieval period. Echoed back under retrievalPeriod; the mock does " +
              "not filter transactions by it."
          },
          {
            name: "dateTo",
            required: false,
            type: "string (date)",
            example: "2026-03-31",
            description:
              "End of the retrieval period. Echoed back under retrievalPeriod; the mock does " +
              "not filter transactions by it."
          },
          {
            name: "bookingStatus",
            required: false,
            type: "string",
            enum: ["BOOKED", "PENDING"],
            example: "BOOKED",
            description: "Accepted for contract compatibility; the mock does not filter on it."
          },
          {
            name: "pageNumber",
            required: false,
            type: "integer",
            default: 1,
            example: "1",
            description:
              "Echoed back under pagination. The mock returns every record on one page " +
              "(totalPages is always 1, hasMore always false)."
          },
          {
            name: "pageSize",
            required: false,
            type: "integer",
            default: 200,
            example: "200",
            description: "Echoed back under pagination. The mock does not slice the result."
          }
        ],
        responses: [
          { status: 200, description: "History found — messageHeader, retrievalPeriod, pagination, accounts, aggregates" },
          { status: 401, description: "Missing or wrong username/password (AUTH-1401)" },
          { status: 404, description: "No transaction data for this customer (CIN-3404)" }
        ],
        notes: [
          "Query parameters are all optional: a plain GET returns every account for the customer."
        ]
      }
    ]
  }
];

// --- custom mock APIs (created through the portal, generic store-and-return) ---
function customOperations(api) {
  const base = `${MOCK_BASE}/${api.slug}`;
  const recordId = firstRecordId(api.slug) || "sample";
  const bodyExample = api.sampleRequest || api.sampleResponse || { exampleField: "value" };
  const idParam = (description) => ({
    name: "id",
    required: true,
    type: "string",
    example: recordId,
    description
  });

  return [
    {
      id: "list-records",
      method: "GET",
      pathTemplate: base,
      summary: `List every stored ${api.displayName} record`,
      pathParams: [],
      queryParams: [],
      responses: [
        { status: 200, description: "{ messageHeader, apiSlug, count, records: [{ id, statusCode, body }] }" },
        { status: 401, description: "Missing or wrong username/password (AUTH-1401)" },
        { status: 404, description: "This mock API is not registered (MOCK-0404)" }
      ],
      notes: ["No query parameters: this returns all records. Filtering would have to be hand-coded."]
    },
    {
      id: "get-record",
      method: "GET",
      pathTemplate: `${base}/{id}`,
      summary: `Fetch one ${api.displayName} record`,
      pathParams: [idParam("The record id — the filename (without .json) under Manage Data.")],
      queryParams: [],
      responses: [
        { status: 200, description: "The stored JSON, exactly as saved (minus __status)" },
        { status: 401, description: "Missing or wrong username/password (AUTH-1401)" },
        { status: 404, description: "No such record, or the API is not registered (MOCK-0404)" }
      ],
      notes: [
        "If the stored record has a top-level \"__status\" field (e.g. \"__status\": 422), this " +
          "returns that status instead of 200 — that is how you simulate error paths."
      ]
    },
    {
      id: "put-record",
      method: "PUT",
      pathTemplate: `${base}/{id}`,
      summary: `Create or overwrite one ${api.displayName} record`,
      pathParams: [idParam("The record id to write. Letters, numbers, dots, hyphens, underscores; max 80 characters.")],
      queryParams: [],
      requestBody: {
        required: true,
        contentType: "application/json",
        description: "Any JSON object — it is stored verbatim and returned as-is by the GET above.",
        example: bodyExample
      },
      responses: [
        { status: 200, description: "{ status: \"ok\", apiSlug, id }" },
        { status: 400, description: "Body was not a JSON object (MOCK-0400), or the id has invalid characters" },
        { status: 401, description: "Missing or wrong username/password (AUTH-1401)" },
        { status: 404, description: "This mock API is not registered (MOCK-0404)" }
      ]
    },
    {
      id: "delete-record",
      method: "DELETE",
      pathTemplate: `${base}/{id}`,
      summary: `Delete one ${api.displayName} record`,
      pathParams: [idParam("The record id to delete.")],
      queryParams: [],
      responses: [
        { status: 200, description: "{ status: \"ok\", apiSlug, id }" },
        { status: 401, description: "Missing or wrong username/password (AUTH-1401)" },
        { status: 404, description: "This mock API is not registered (MOCK-0404)" }
      ]
    }
  ];
}

function firstRecordId(slug) {
  const files = store.listFiles(slug);
  return files.length ? files[0].id : null;
}

// --- materialising a spec into something copy-pasteable ---

// Replace {placeholders} with each parameter's example value, so the URL and curl we
// show are real calls the user can run, not templates they have to fill in by hand.
function fillPath(pathTemplate, pathParams) {
  return (pathParams || []).reduce(
    (p, param) => p.replace(`{${param.name}}`, encodeURIComponent(param.example)),
    pathTemplate
  );
}

// Only required query params go into the example URL — optional ones are listed in the
// parameter table instead, so the example stays the shortest call that actually works.
function exampleQuery(queryParams) {
  const required = (queryParams || []).filter(q => q.required);
  if (!required.length) return "";
  return "?" + required.map(q => `${q.name}=${encodeURIComponent(q.example)}`).join("&");
}

function shellQuote(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
}

function curlFor(op, url, username) {
  const parts = [`curl -u ${shellQuote(`${username || "username"}:<password>`)}`];
  if (op.method !== "GET") parts.push(`-X ${op.method}`);
  if (op.requestBody) {
    parts.push(`-H 'Content-Type: application/json'`);
    parts.push(`-d ${shellQuote(JSON.stringify(op.requestBody.example))}`);
  }
  parts.push(shellQuote(url));
  return parts.join(" \\\n  ");
}

function materializeOperation(op, baseUrl, username) {
  const pathWithValues = fillPath(op.pathTemplate, op.pathParams);
  const url = `${baseUrl}${pathWithValues}${exampleQuery(op.queryParams)}`;
  const headers = [authHeader(username), CORRELATION_HEADER];
  if (op.requestBody) headers.splice(1, 0, JSON_BODY_HEADER);
  return {
    ...op,
    headers,
    urlTemplate: `${baseUrl}${op.pathTemplate}`,
    exampleUrl: url,
    curl: curlFor(op, url, username)
  };
}

function buildCatalog({ baseUrl, username }) {
  const base = String(baseUrl || "").replace(/\/+$/, "");

  const builtIn = BUILTIN_APIS.map(api => ({
    slug: api.slug,
    displayName: api.displayName,
    kind: "built-in",
    description: api.description,
    sourceSystem: api.sourceSystem,
    recordUrlTemplate: `${base}${api.recordUrlTemplate}`,
    fileCount: store.listFiles(api.slug).length,
    examples: api.examples,
    operations: api.operations.map(op => materializeOperation(op, base, username))
  }));

  const custom = store.listApis().map(api => ({
    slug: api.slug,
    displayName: api.displayName,
    kind: "custom",
    description: api.description || "",
    team: api.team || "",
    contact: api.contact || "",
    tags: api.tags || [],
    createdBy: api.createdBy || "",
    createdAt: api.createdAt || null,
    sourceSystem: "MOCK-STUB",
    recordUrlTemplate: `${base}${MOCK_BASE}/${api.slug}/{recordId}`,
    fileCount: store.listFiles(api.slug).length,
    availableIds: store.listFiles(api.slug).map(f => f.id).slice(0, 20),
    sampleResponse: api.sampleResponse || null,
    sampleRequest: api.sampleRequest || null,
    operations: customOperations(api).map(op => materializeOperation(op, base, username))
  }));

  return {
    baseUrl: base,
    auth: {
      type: "HTTP Basic",
      username: username || null,
      description:
        "Send Authorization: Basic base64(username:password) on every call. Each team has its " +
        "own username/password pair — use the one you signed in to this portal with. " +
        "/health, /docs and /openapi.json are the only unauthenticated endpoints.",
      curlFlag: `-u ${shellQuote(`${username || "username"}:<password>`)}`
    },
    links: {
      swaggerUi: `${base}/docs`,
      openapiJson: `${base}/openapi.json`,
      health: `${base}/health`
    },
    notes: [
      RATE_LIMIT_NOTE,
      "Every response carries a messageHeader (correlationId, timestamp, sourceSystem, apiVersion); " +
        "errors use a shared envelope with status, correlationId, timestamp, path and an errors[] array.",
      "CORS is open, so a browser app can call these endpoints directly."
    ],
    apis: [...builtIn, ...custom]
  };
}

module.exports = { buildCatalog, MOCK_BASE };
