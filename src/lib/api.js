import { API_BASE_URL, API_ORIGIN } from "./config";

const TOKEN_KEY = "agsb_token";

// Returns null when there is no image, so callers render a placeholder
// instead of an <img src=""> (which re-requests the current page).
export function resolveImage(path) {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${API_ORIGIN}${path}`;
}

// Unsplash resizes on the fly via ?w=, so offer the browser several widths
// instead of the fixed ?w=600 stored with the record. Other hosts: no srcset.
const SRCSET_WIDTHS = [400, 600, 800, 1200, 1600, 2000];
export function imageSrcSet(url) {
  if (!url || !url.startsWith("https://images.unsplash.com/")) return undefined;
  try {
    return SRCSET_WIDTHS.map((w) => {
      const u = new URL(url);
      u.searchParams.set("w", String(w));
      return `${u.href} ${w}w`;
    }).join(", ");
  } catch {
    return undefined;
  }
}

function withId(doc) {
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) return doc;
  return doc._id ? { ...doc, id: doc._id } : doc;
}

function normalize(data) {
  if (Array.isArray(data)) return data.map(withId);
  return withId(data);
}

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const USER_KEY = "agsb_user";
export const AUTH_EXPIRED_EVENT = "auth:expired";

// Clears the stored session and tells AuthContext, which drops the user;
// RequireAuth then sends the visitor to /login and back afterwards.
function handleUnauthorized() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
}

// Reads the body without assuming JSON (proxies and Express 404s send HTML).
async function readBody(res) {
  const text = await res.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function requestError(res, data) {
  const message = (data && typeof data.message === "string" && data.message)
    || res.statusText
    || "Request failed";
  const err = new Error(message);
  err.status = res.status;
  return err;
}

async function request(path, init) {
  const headers = { ...init.headers, ...authHeaders() };
  const hadToken = Boolean(headers.Authorization);
  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    // Network failure: no status, so callers can tell it apart from a 401.
    throw new Error("Could not reach the server. Check your connection and try again.");
  }
  const data = await readBody(res);
  // A 401 from /auth/* (e.g. a wrong password) is just an error to show.
  if (res.status === 401 && hadToken && !path.startsWith("/auth/")) handleUnauthorized();
  return { res, data };
}

export async function apiGet(path) {
  const { res, data } = await request(path, {});
  if (!res.ok || data === null) throw requestError(res, data);
  return normalize(data);
}

export async function apiSend(path, method, body) {
  const { res, data } = await request(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok || !data || data.success === false) throw requestError(res, data);
  return data;
}

// Fetches a file (sent with the session token when there is one) as a Blob.
// Errors carry the server's message and status, like apiGet.
export async function apiDownload(path) {
  const headers = authHeaders();
  let res;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { headers });
  } catch {
    throw new Error("Could not reach the server. Check your connection and try again.");
  }
  if (!res.ok) {
    const data = await readBody(res);
    if (res.status === 401 && headers.Authorization) handleUnauthorized();
    throw requestError(res, data);
  }
  return res.blob();
}

export { TOKEN_KEY };
