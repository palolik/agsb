import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet } from "../lib/api";

// Shared in-memory cache for public list endpoints. Several pages load the
// same lists (/districts, /divisions, /plans, ...), so moving between them
// reuses one response for CACHE_TTL instead of refetching.
// Only this allowlist is cached: user-specific endpoints (/profile,
// /bookings/my, /bookings/:id) and detail pages always go to the network.
// Any GET that is already in flight is shared by everyone asking for the
// same path at that moment (e.g. two components, or StrictMode re-runs).
const CACHE_TTL = 60_000;
const CACHEABLE = new Set([
  "/districts",
  "/attractions",
  "/divisions",
  "/plans",
  "/blog",
  "/membership-plans",
  "/partners",
  "/frames",
  "/payment-methods",
]);
const cache = new Map(); // path -> { data, at }
const inflight = new Map(); // path -> Promise

function cached(path) {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < CACHE_TTL) return hit;
  if (hit) cache.delete(path);
  return null;
}

function load(path, force) {
  if (!force && inflight.has(path)) return inflight.get(path);
  const promise = apiGet(path)
    .then((data) => {
      if (CACHEABLE.has(path)) cache.set(path, { data, at: Date.now() });
      return data;
    })
    .finally(() => {
      if (inflight.get(path) === promise) inflight.delete(path);
    });
  inflight.set(path, promise);
  return promise;
}

// Drops cached responses (all, or one path), e.g. after data changes.
export function clearFetchCache(path) {
  if (path) cache.delete(path);
  else cache.clear();
}

const initial = (path) => {
  const hit = cached(path);
  return hit
    ? { path, data: hit.data, loading: false, error: null, status: null }
    : { path, data: null, loading: true, error: null, status: null };
};

// Returns { data, loading, error, status, reload }.
// - `error` is the message string; `status` is the HTTP status (e.g. 404),
//   or null for network failures, so detail pages can show "not found".
// - `reload()` re-runs the request, bypassing the cache (used by
//   ErrorState's retry button).
// - Data or errors from a previous path are never shown for a new one: the
//   state is reset during render as soon as the path changes.
export function useFetch(path) {
  const [state, setState] = useState(() => initial(path));
  const [attempt, setAttempt] = useState(0);
  const forceRef = useRef(false);

  let current = state;
  if (state.path !== path) {
    current = initial(path);
    setState(current);
  }

  useEffect(() => {
    const force = forceRef.current;
    forceRef.current = false;

    if (!force) {
      const hit = cached(path);
      if (hit) {
        setState((s) => (s.path === path && s.data === hit.data && !s.loading ? s
          : { path, data: hit.data, loading: false, error: null, status: null }));
        return undefined;
      }
    }

    let cancelled = false;
    setState((s) => (s.loading && !s.error ? s : { ...s, path, loading: true, error: null, status: null }));

    load(path, force)
      .then((result) => {
        if (!cancelled) setState({ path, data: result, loading: false, error: null, status: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setState({ path, data: null, loading: false, error: err.message || "Request failed", status: err.status ?? null });
        }
      });

    return () => { cancelled = true; };
  }, [path, attempt]);

  const reload = useCallback(() => {
    forceRef.current = true;
    setAttempt((n) => n + 1);
  }, []);

  return { data: current.data, loading: current.loading, error: current.error, status: current.status, reload };
}
