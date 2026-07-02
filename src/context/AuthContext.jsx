import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

const USERS_KEY = "agsb_users";
const SESSION_KEY = "agsb_session";

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem(SESSION_KEY);
    if (email) {
      const found = loadUsers().find((u) => u.email === email);
      if (found) setUser(found);
    }
    setReady(true);
  }, []);

  function signup({ name, email, phone, password, district }) {
    const users = loadUsers();
    if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("An account with this email already exists.");
    }
    const newUser = {
      name,
      email,
      phone,
      password,
      district,
      plan: "Explorer",
      joined: new Date().toISOString().slice(0, 10),
      visitedDistricts: [],
    };
    saveUsers([...users, newUser]);
    localStorage.setItem(SESSION_KEY, email);
    setUser(newUser);
  }

  function login({ email, password }) {
    const users = loadUsers();
    const found = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!found) throw new Error("Invalid email or password.");
    localStorage.setItem(SESSION_KEY, found.email);
    setUser(found);
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }

  function updateUser(patch) {
    setUser((current) => {
      if (!current) return current;
      const users = loadUsers();
      const idx = users.findIndex((u) => u.email === current.email);
      const updated = { ...current, ...patch };
      if (idx !== -1) {
        users[idx] = updated;
        saveUsers(users);
      }
      return updated;
    });
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
