// Trailing slashes dropped: paths start with "/", so "…/api/" would request "…/api//x".
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api").replace(/\/+$/, "");
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");
