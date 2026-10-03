import { API_BASE_URL, API_ORIGIN } from "./config";

const TOKEN_KEY = "agsb_token";

export function resolveImage(path) {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  return `${API_ORIGIN}${path}`;
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

export { TOKEN_KEY };
