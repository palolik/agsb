// API data can be missing or malformed (older/hand-edited records,
// parseJsonField returning a string). These keep one bad record from
// crashing a whole page.
export const asArray = (value) => (Array.isArray(value) ? value : []);

export const asText = (value) => (value === null || value === undefined ? "" : String(value));
