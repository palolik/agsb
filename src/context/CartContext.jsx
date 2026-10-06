import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { MAX_QTY } from "../lib/shop";

// Shopping cart for the gear shop, kept in localStorage so it survives
// reloads. Each line stores a product snapshot for display only; the server
// re-prices and re-checks stock when the order is placed.
const CART_KEY = "agsb_cart";
const CartContext = createContext(null);

function readCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY));
    return Array.isArray(parsed) ? parsed.filter((i) => i && i.productId && i.key) : [];
  } catch {
    return [];
  }
}

function writeCart(items) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    // storage full or blocked: the cart still works for this tab
  }
}

const sortedOptions = (options) =>
  Object.keys(options || {}).sort().reduce((acc, k) => ({ ...acc, [k]: options[k] }), {});

// Same product + kind + options (+ dates for rentals) is one line.
export function cartKey({ productId, kind, options, startDate, endDate }) {
  const dates = kind === "rent" ? `${startDate || ""}~${endDate || ""}` : "";
  return [productId, kind, JSON.stringify(sortedOptions(options)), dates].join("|");
}

const clampQty = (qty, max) => Math.max(1, Math.min(Number(qty) || 1, max ?? MAX_QTY, MAX_QTY));

// Max units for a line, from the stock in the snapshot (0 stock still allows
// 1 so the line stays editable; the server reports the real availability).
const lineMax = (item) => Math.max(1, Math.min(MAX_QTY, Number(item.stock) || MAX_QTY));

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);

  useEffect(() => { writeCart(items); }, [items]);

  // Keep several open tabs in step.
  useEffect(() => {
    const onStorage = (e) => { if (e.key === CART_KEY) setItems(readCart()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // product: the API product; line: { kind, qty, options, startDate, endDate }
  const addItem = useCallback((product, line) => {
    const base = {
      productId: product._id,
      kind: line.kind,
      options: sortedOptions(line.options),
      ...(line.kind === "rent" ? { startDate: line.startDate, endDate: line.endDate } : {}),
    };
    const key = cartKey(base);
    const snapshot = {
      ...base,
      key,
      slug: product.slug,
      name: product.name,
      name_bn: product.name_bn,
      image: product.images?.[0] || "",
      salePrice: product.salePrice,
      rentPerDay: product.rentPerDay,
      rentDeposit: product.rentDeposit || 0,
      stock: line.kind === "rent" ? product.rentStock : product.saleStock,
    };
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) => (i.key === key ? { ...i, ...snapshot, qty: clampQty(i.qty + line.qty, lineMax(snapshot)) } : i));
      }
      return [...prev, { ...snapshot, qty: clampQty(line.qty, lineMax(snapshot)) }];
    });
  }, []);

  const updateQty = useCallback((key, qty) => {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, qty: clampQty(qty, lineMax(i)) } : i)));
  }, []);

  // Changes a rental's dates; merges into another line if one now matches.
  const updateDates = useCallback((key, startDate, endDate) => {
    setItems((prev) => {
      const item = prev.find((i) => i.key === key);
      if (!item) return prev;
      const next = { ...item, startDate, endDate };
      next.key = cartKey(next);
      const twin = prev.find((i) => i.key === next.key && i.key !== key);
      if (twin) {
        return prev.filter((i) => i.key !== key).map((i) => (i.key === twin.key ? { ...i, qty: clampQty(i.qty + item.qty, lineMax(i)) } : i));
      }
      return prev.map((i) => (i.key === key ? next : i));
    });
  }, []);

  const removeItem = useCallback((key) => setItems((prev) => prev.filter((i) => i.key !== key)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => ({
    items,
    count: items.reduce((n, i) => n + (Number(i.qty) || 0), 0),
    addItem,
    updateQty,
    updateDates,
    removeItem,
    clear,
  }), [items, addItem, updateQty, updateDates, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
