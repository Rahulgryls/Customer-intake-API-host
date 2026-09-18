// File-backed data store for the admin portal.
// Built-in categories (customers, risk-profiles, transactions) back the three real,
// hand-coded business APIs and seed from data/mockData.js on first run.
// Custom categories are created at runtime through the admin portal's "Manage APIs"
// tab, for POC/stubbing purposes - each gets its own folder under data/files/<slug>/
// and is served generically (no business logic, just stored JSON).
// NOTE: on free hosting the filesystem is ephemeral - everything here (built-in data
// AND any custom APIs/files you create) survives normal operation and restarts on the
// same instance, but a fresh deploy (git push) reseeds/clears unless a persistent
// volume or real DB is added. Download anything you want to keep before redeploying.
const fs = require("fs");
const path = require("path");
const defaults = require("./mockData");

const FILES_ROOT = path.join(__dirname, "files");
const REGISTRY_PATH = path.join(__dirname, "apiRegistry.json");

const BUILTIN_SOURCE = { customers: "customers", "risk-profiles": "riskProfiles", transactions: "transactions" };
const BUILTIN_CATEGORIES = Object.keys(BUILTIN_SOURCE);
const RESERVED_SLUGS = new Set([
  ...BUILTIN_CATEGORIES, "admin", "docs", "openapi", "health", "customer-intake", "files", "api", "mock"
]);

class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function dirFor(category) { return path.join(FILES_ROOT, category); }

function loadRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) return [];
  try { return JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8")); } catch { return []; }
}
function saveRegistry(reg) { fs.writeFileSync(REGISTRY_PATH, JSON.stringify(reg, null, 2)); }

function customCategories() { return loadRegistry().map(a => a.slug); }
function allCategories() { return [...BUILTIN_CATEGORIES, ...customCategories()]; }

function ensureSeeded() {
  for (const category of BUILTIN_CATEGORIES) {
    const dir = dirFor(category);
    fs.mkdirSync(dir, { recursive: true });
    const existing = fs.readdirSync(dir).filter(f => f.endsWith(".json"));
    if (existing.length === 0) {
      const seed = defaults[BUILTIN_SOURCE[category]];
      for (const [id, value] of Object.entries(seed)) {
        fs.writeFileSync(path.join(dir, id + ".json"), JSON.stringify(value, null, 2));
      }
    }
  }
  for (const slug of customCategories()) fs.mkdirSync(dirFor(slug), { recursive: true });
}
ensureSeeded();

function loadAll(category) {
  const dir = dirFor(category);
  if (!fs.existsSync(dir)) return {};
  const out = {};
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".json")) continue;
    try { out[f.slice(0, -5)] = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); }
    catch { /* skip unreadable file */ }
  }
  return out;
}

function listFiles(category) {
  const dir = dirFor(category);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith(".json")).map(f => {
    const stat = fs.statSync(path.join(dir, f));
    return { category, id: f.slice(0, -5), filename: f, sizeBytes: stat.size, updatedAt: stat.mtime.toISOString() };
  }).sort((a, b) => a.id.localeCompare(b.id));
}

function readFileRaw(category, id) {
  const p = path.join(dirFor(category), id + ".json");
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
}

function writeFile(category, id, jsonValue) {
  fs.mkdirSync(dirFor(category), { recursive: true });
  fs.writeFileSync(path.join(dirFor(category), id + ".json"), JSON.stringify(jsonValue, null, 2));
}

function deleteFile(category, id) {
  const p = path.join(dirFor(category), id + ".json");
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

// --- API registry: custom mock APIs created via the admin portal ---

function slugify(name) {
  return String(name || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

function listApis() { return loadRegistry(); }

function parseTags(tags) {
  if (Array.isArray(tags)) return tags.map(t => String(t).trim()).filter(Boolean).slice(0, 10);
  if (typeof tags === "string") return tags.split(",").map(t => t.trim()).filter(Boolean).slice(0, 10);
  return [];
}

function createApi({ name, description, team, contact, tags, sampleResponse, sampleRequest }) {
  const slug = slugify(name);
  if (!slug || slug.length < 2) throw new ApiError(400, "Provide a valid API name (letters/numbers, at least 2 characters)");
  if (RESERVED_SLUGS.has(slug)) throw new ApiError(400, `"${slug}" is a reserved name — choose another`);
  const reg = loadRegistry();
  if (reg.some(a => a.slug === slug)) throw new ApiError(409, `An API named "${slug}" already exists`);
  if (sampleResponse !== undefined && sampleResponse !== null && typeof sampleResponse !== "object") {
    throw new ApiError(400, "Sample response, if provided, must be a JSON object or array");
  }
  if (sampleRequest !== undefined && sampleRequest !== null && typeof sampleRequest !== "object") {
    throw new ApiError(400, "Sample request, if provided, must be a JSON object or array");
  }
  const entry = {
    slug,
    displayName: String(name).trim(),
    description: description ? String(description).trim() : "",
    team: team ? String(team).trim() : "",
    contact: contact ? String(contact).trim() : "",
    tags: parseTags(tags),
    createdAt: new Date().toISOString(),
    sampleResponse: sampleResponse ?? null,
    sampleRequest: sampleRequest ?? null
  };
  reg.push(entry);
  saveRegistry(reg);
  fs.mkdirSync(dirFor(slug), { recursive: true });
  if (entry.sampleResponse) writeFile(slug, "sample", entry.sampleResponse);
  return entry;
}

function deleteApi(slug) {
  if (BUILTIN_CATEGORIES.includes(slug)) throw new ApiError(400, "Built-in APIs can't be deleted from here — they're part of the app's code");
  const reg = loadRegistry();
  const idx = reg.findIndex(a => a.slug === slug);
  if (idx === -1) return false;
  reg.splice(idx, 1);
  saveRegistry(reg);
  const dir = dirFor(slug);
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  return true;
}

module.exports = {
  BUILTIN_CATEGORIES,
  get CATEGORIES() { return allCategories(); },
  get customers() { return loadAll("customers"); },
  get riskProfiles() { return loadAll("risk-profiles"); },
  get transactions() { return loadAll("transactions"); },
  get siebelIndex() {
    const idx = {};
    for (const [id, c] of Object.entries(loadAll("customers"))) if (c && c.siebelId) idx[c.siebelId] = id;
    return idx;
  },
  listFiles, readFileRaw, writeFile, deleteFile,
  listApis, createApi, deleteApi,
  ApiError
};
