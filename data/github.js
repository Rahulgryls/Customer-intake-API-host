// Thin wrapper around the GitHub Contents/Git APIs, used to make GitHub the durable
// backing store for this app's local disk (which resets on every redeploy otherwise).
// Uses Node's built-in fetch - no new dependency. Every function is best-effort: on
// failure it returns { ok:false, error } rather than throwing, so a flaky GitHub call
// never breaks the caller's local write (see server.js's change listener).
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";
// Overridable only for tests, so we can point this at a local mock instead of the real
// api.github.com without ever touching a real token.
const API_BASE = process.env.GITHUB_API_BASE || "https://api.github.com";

function isConfigured() { return !!(GITHUB_TOKEN && GITHUB_REPO); }

function headers() {
  return { Authorization: `token ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json", "User-Agent": "customer-intake-api-admin" };
}

async function getSha(repoPath) {
  const res = await fetch(`${API_BASE}/repos/${GITHUB_REPO}/contents/${repoPath}?ref=${encodeURIComponent(GITHUB_BRANCH)}`, { headers: headers() });
  if (res.status === 200) return (await res.json()).sha;
  if (res.status === 404) return undefined;
  throw new Error(`lookup failed (${res.status})`);
}

async function putFile(repoPath, content, message) {
  if (!isConfigured()) return { ok: false, error: "not configured" };
  try {
    const sha = await getSha(repoPath);
    const res = await fetch(`${API_BASE}/repos/${GITHUB_REPO}/contents/${repoPath}`, {
      method: "PUT", headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify({
        message, content: Buffer.from(content, "utf8").toString("base64"),
        branch: GITHUB_BRANCH, ...(sha ? { sha } : {})
      })
    });
    if (!res.ok) return { ok: false, error: `${res.status}: ${(await res.text()).slice(0, 300)}` };
    const result = await res.json();
    return { ok: true, htmlUrl: result.content && result.content.html_url };
  } catch (e) { return { ok: false, error: e.message }; }
}

async function deleteFile(repoPath, message) {
  if (!isConfigured()) return { ok: false, error: "not configured" };
  try {
    const sha = await getSha(repoPath);
    if (!sha) return { ok: true }; // already gone
    const res = await fetch(`${API_BASE}/repos/${GITHUB_REPO}/contents/${repoPath}`, {
      method: "DELETE", headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify({ message, sha, branch: GITHUB_BRANCH })
    });
    if (!res.ok) return { ok: false, error: `${res.status}: ${(await res.text()).slice(0, 300)}` };
    return { ok: true };
  } catch (e) { return { ok: false, error: e.message }; }
}

// Lists every file under a path prefix (e.g. "data/committed/") and fetches its content,
// used once at startup to rehydrate the local disk before the app starts serving traffic.
async function fetchSnapshot(prefix) {
  if (!isConfigured()) return [];
  try {
    const refRes = await fetch(`${API_BASE}/repos/${GITHUB_REPO}/git/ref/heads/${GITHUB_BRANCH}`, { headers: headers() });
    if (!refRes.ok) { console.error("[github] ref lookup failed:", refRes.status); return []; }
    const commitSha = (await refRes.json()).object.sha;
    const treeRes = await fetch(`${API_BASE}/repos/${GITHUB_REPO}/git/trees/${commitSha}?recursive=1`, { headers: headers() });
    if (!treeRes.ok) { console.error("[github] tree lookup failed:", treeRes.status); return []; }
    const tree = (await treeRes.json()).tree || [];
    const paths = tree.filter(t => t.type === "blob" && t.path.startsWith(prefix)).map(t => t.path);
    const entries = [];
    for (const p of paths) {
      const res = await fetch(`${API_BASE}/repos/${GITHUB_REPO}/contents/${p}?ref=${encodeURIComponent(GITHUB_BRANCH)}`, { headers: headers() });
      if (!res.ok) { console.error(`[github] fetch failed for ${p}:`, res.status); continue; }
      const j = await res.json();
      entries.push({ repoPath: p, content: Buffer.from(j.content, "base64").toString("utf8") });
    }
    return entries;
  } catch (e) { console.error("[github] snapshot fetch error:", e.message); return []; }
}

module.exports = { isConfigured, putFile, deleteFile, fetchSnapshot };
