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

export async function apiGet(path) {
  const res = await fetch(`${API_BASE_URL}${path}`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return normalize(data);
}

export async function apiSend(path, method, body) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

export { TOKEN_KEY };
