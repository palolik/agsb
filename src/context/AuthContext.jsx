import { createContext, useContext, useEffect, useState } from "react";
import { apiGet, apiSend } from "../lib/api";

const AuthContext = createContext(null);

const TOKEN_KEY = "agsb_token";
const USER_KEY = "agsb_user";

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

  useEffect(() => {
    const stored = loadStoredUser();
    if (stored) setUser(stored);
    setReady(true);

    if (stored && localStorage.getItem(TOKEN_KEY)) {
      apiGet("/profile")
        .then((data) => {
          setUser(data.user);
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        })
        .catch(() => {
          // stale/expired token — clear silently, user stays logged out on next reload
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        });
    }
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
