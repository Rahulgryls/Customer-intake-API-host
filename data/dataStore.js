// Mutable data store backing the admin portal.
// Starts from the built-in mock data, persists edits to store.json on disk.
// NOTE: on free hosting the filesystem is ephemeral - edits survive normal
// operation and restarts on the same instance, but a fresh deploy resets
// back to the defaults below unless a persistent volume / real DB is added.
const fs = require("fs");
const path = require("path");
const defaults = require("./mockData");

const STORE_PATH = path.join(__dirname, "store.json");

function defaultState() {
  return {
    customers: JSON.parse(JSON.stringify(defaults.customers)),
    riskProfiles: JSON.parse(JSON.stringify(defaults.riskProfiles)),
    transactions: JSON.parse(JSON.stringify(defaults.transactions))
  };
}

function load() {
  if (fs.existsSync(STORE_PATH)) {
    try { return JSON.parse(fs.readFileSync(STORE_PATH, "utf8")); }
    catch { /* corrupt file - fall back to defaults */ }
  }
  return defaultState();
}

let state = load();

function save() {
  try { fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2)); }
  catch (e) { console.error("dataStore: failed to persist store.json:", e.message); }
}
if (!fs.existsSync(STORE_PATH)) save();

function rebuildSiebelIndex() {
  const idx = {};
  for (const [id, c] of Object.entries(state.customers)) {
    if (c && c.siebelId) idx[c.siebelId] = id;
  }
  return idx;
}

module.exports = {
  get customers() { return state.customers; },
  get riskProfiles() { return state.riskProfiles; },
  get transactions() { return state.transactions; },
  get siebelIndex() { return rebuildSiebelIndex(); },

  upsertCustomer(id, data) { state.customers[id] = data; save(); },
  deleteCustomer(id) { delete state.customers[id]; save(); },

  upsertRiskProfile(id, data) { state.riskProfiles[id] = data; save(); },
  deleteRiskProfile(id) { delete state.riskProfiles[id]; save(); },

  upsertTransactions(id, data) { state.transactions[id] = data; save(); },
  deleteTransactions(id) { delete state.transactions[id]; save(); },

  resetToDefaults() { state = defaultState(); save(); }
};
