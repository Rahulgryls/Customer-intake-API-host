// File-backed data store for the admin portal.
// Each record is a real .json file under data/files/<category>/<id>.json.
// NOTE: on free hosting the filesystem is ephemeral - files survive normal
// operation and restarts on the same instance, but a fresh deploy reseeds
// from the built-in mock data below unless a persistent volume / real DB is added.
const fs = require("fs");
const path = require("path");
const defaults = require("./mockData");

const FILES_ROOT = path.join(__dirname, "files");

// URL/category-friendly folder name -> the mockData.js export it seeds from
const CATEGORY_SOURCE = { customers: "customers", "risk-profiles": "riskProfiles", transactions: "transactions" };
const CATEGORIES = Object.keys(CATEGORY_SOURCE);

function dirFor(category) { return path.join(FILES_ROOT, category); }

function ensureSeeded() {
  for (const category of CATEGORIES) {
    const dir = dirFor(category);
    fs.mkdirSync(dir, { recursive: true });
    const existing = fs.readdirSync(dir).filter(f => f.endsWith(".json"));
    if (existing.length === 0) {
      const seed = defaults[CATEGORY_SOURCE[category]];
      for (const [id, value] of Object.entries(seed)) {
        fs.writeFileSync(path.join(dir, id + ".json"), JSON.stringify(value, null, 2));
      }
    }
  }
}
ensureSeeded();

function loadAll(category) {
  const dir = dirFor(category);
  const out = {};
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".json")) continue;
    try { out[f.slice(0, -5)] = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")); }
    catch { /* skip unreadable file */ }
  }
  return out;
}

let cache = {};
for (const category of CATEGORIES) cache[category] = loadAll(category);

function listFiles(category) {
  const dir = dirFor(category);
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
  fs.writeFileSync(path.join(dirFor(category), id + ".json"), JSON.stringify(jsonValue, null, 2));
  cache[category][id] = jsonValue;
}

function deleteFile(category, id) {
  const p = path.join(dirFor(category), id + ".json");
  if (fs.existsSync(p)) fs.unlinkSync(p);
  delete cache[category][id];
}

module.exports = {
  CATEGORIES,
  get customers() { return cache.customers; },
  get riskProfiles() { return cache["risk-profiles"]; },
  get transactions() { return cache.transactions; },
  get siebelIndex() {
    const idx = {};
    for (const [id, c] of Object.entries(cache.customers)) if (c && c.siebelId) idx[c.siebelId] = id;
    return idx;
  },
  listFiles, readFileRaw, writeFile, deleteFile
};
