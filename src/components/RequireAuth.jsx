import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Sends logged-out visitors to login, then back to the page they wanted.
export default function RequireAuth({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search + location.hash }} />;
  return children;
}
