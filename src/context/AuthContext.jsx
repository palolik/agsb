import { createContext, useContext, useEffect, useRef, useState } from "react";
import { apiGet, apiSend, TOKEN_KEY, USER_KEY, AUTH_EXPIRED_EVENT } from "../lib/api";

const AuthContext = createContext(null);

function loadStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

function persist(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  // Bumped by updateUser so a slower startup /profile response can't
  // overwrite a newer user (e.g. a check-in saved while it was loading).
  const updateCount = useRef(0);

  useEffect(() => {
    // api.js fires this on any 401 after it has cleared the stored session.
    const onExpired = () => setUser(null);
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);

    const stored = loadStoredUser();
    if (stored) setUser(stored);
    setReady(true);

    if (stored && localStorage.getItem(TOKEN_KEY)) {
      const sentAt = updateCount.current;
      apiGet("/profile")
        .then((data) => {
          if (!data?.user || updateCount.current !== sentAt) return;
          setUser(data.user);
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        })
        .catch((err) => {
          // Only an auth failure ends the session; a network error or 5xx
          // (backend briefly down) keeps the stored user logged in.
          if (err.status === 401) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setUser(null);
          }
        });
    } else if (stored) {
      // A user without a token can't call member APIs; treat as logged out.
      localStorage.removeItem(USER_KEY);
      setUser(null);
    }

    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  async function signup({ name, email, phone, password, district }) {
    const data = await apiSend("/auth/signup", "POST", { name, email, phone, password, district });
    persist(data.token, data.user);
    setUser(data.user);
  }

  async function login({ email, password }) {
    const data = await apiSend("/auth/login", "POST", { email, password });
    persist(data.token, data.user);
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  async function updateUser(patch) {
    const data = await apiSend("/profile", "PATCH", patch);
    updateCount.current += 1;
    setUser(data.user);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
