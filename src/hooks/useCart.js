import { useEffect, useMemo, useRef, useState } from "react";
import { apiRequest } from "../utils/api.js";

const STORAGE_KEY = "simvol-sporta-cart";

function getStoredCart(key = `${STORAGE_KEY}:guest`, products = []) {
  try {
    const storedCart = localStorage.getItem(key);
    if (!storedCart) return {};

    const parsedCart = JSON.parse(storedCart);
    if (!parsedCart || typeof parsedCart !== "object" || Array.isArray(parsedCart)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsedCart).filter(([id, quantity]) =>
        (products.some((product) => product.id === id) || /^custom-[0-9a-f-]{36}$/.test(id)) &&
        Number.isInteger(quantity) &&
        quantity > 0 &&
        quantity <= 99,
      ),
    );
  } catch {
    return {};
  }
}

export function useCart(products, user) {
  const [quantities, setQuantities] = useState(() => getStoredCart(undefined, products));
  const [syncError, setSyncError] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const readyKey = useRef(`${STORAGE_KEY}:guest`);
  const userIdRef = useRef(null);
  const loadGeneration = useRef(0);
  const saveTimer = useRef(null);
  const saveRequest = useRef(Promise.resolve());

  function storageKey(user) {
    return `${STORAGE_KEY}:${user?.id || "guest"}`;
  }

  useEffect(() => {
    let active = true;
    const key = storageKey(user);
    const generation = ++loadGeneration.current;
    readyKey.current = "";
    userIdRef.current = user?.id || null;

    if (!user) {
      setQuantities(getStoredCart(key, products));
      readyKey.current = key;
      setIsSyncing(false);
      return () => { active = false; };
    }

    async function loadCart() {
      setIsSyncing(true);
      try {
        const { items: remoteItems } = await apiRequest("cart");
        if (!active || userIdRef.current !== user.id || generation !== loadGeneration.current) return;
        const localItems = getStoredCart(key, products);
        const merged = { ...remoteItems };
        for (const [id, quantity] of Object.entries(localItems)) {
          merged[id] = Math.min(99, (merged[id] || 0) + quantity);
        }
        readyKey.current = key;
        setQuantities(merged);
        setSyncError("");
      } catch (error) {
        if (!active || generation !== loadGeneration.current) return;
        readyKey.current = key;
        setSyncError(error.message);
      } finally {
        if (active && userIdRef.current === user.id && generation === loadGeneration.current) setIsSyncing(false);
      }
    }

    loadCart();
    return () => { active = false; };
  }, [user?.id]);

  useEffect(() => {
    const key = storageKey(user);
    if (readyKey.current !== key) return;
    try {
      localStorage.setItem(key, JSON.stringify(quantities));
    } catch {
      setSyncError("Не удалось сохранить корзину в этом браузере");
    }
    if (!user) return;

    const timer = window.setTimeout(() => {
      saveTimer.current = null;
      const request = saveRequest.current.catch(() => {}).then(() => apiRequest("cart", {
        method: "PUT",
        body: JSON.stringify({
          items: Object.entries(quantities).map(([productId, quantity]) => ({ productId, quantity })),
        }),
      }));
      saveRequest.current = request;
      request.then(() => setSyncError("")).catch((error) => setSyncError(error.message));
    }, 350);
    saveTimer.current = timer;
    return () => {
      window.clearTimeout(timer);
      if (saveTimer.current === timer) saveTimer.current = null;
    };
  }, [quantities, user?.id]);

  async function syncNow() {
    if (!user) return;
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    try {
      await saveRequest.current.catch(() => {});
      const request = apiRequest("cart", {
        method: "PUT",
        body: JSON.stringify({
          items: Object.entries(quantities).map(([productId, quantity]) => ({ productId, quantity })),
        }),
      });
      saveRequest.current = request;
      await request;
      setSyncError("");
    } catch (error) {
      setSyncError(error.message);
      throw error;
    }
  }

  async function reloadCart() {
    if (!user) return;
    const generation = ++loadGeneration.current;
    try {
      const { items: remoteItems } = await apiRequest("cart");
      if (generation === loadGeneration.current && userIdRef.current === user.id) {
        readyKey.current = storageKey(user);
        setIsSyncing(false);
        setQuantities(remoteItems);
        setSyncError("");
      }
    } catch (error) {
      if (generation === loadGeneration.current) {
        setIsSyncing(false);
        setSyncError(error.message);
      }
      throw error;
    }
  }

  const items = useMemo(
    () =>
      Object.entries(quantities)
        .map(([id, quantity]) => ({
          product: products.find((product) => product.id === id),
          quantity,
        }))
        .filter((item) => item.product),
    [quantities, products],
  );

  const count = items.reduce((total, item) => total + item.quantity, 0);
  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  function addItem(id) {
    setQuantities((current) => ({
      ...current,
      [id]: Math.min(99, (current[id] || 0) + 1),
    }));
  }

  function changeQuantity(id, amount) {
    setQuantities((current) => {
      const next = Math.min(99, (current[id] || 0) + amount);
      if (next > 0) return { ...current, [id]: next };
      const updated = { ...current };
      delete updated[id];
      return updated;
    });
  }

  function removeItem(id) {
    setQuantities((current) => {
      const updated = { ...current };
      delete updated[id];
      return updated;
    });
  }

  function clearCart() {
    setQuantities({});
  }

  return {
    items,
    quantities,
    count,
    total,
    addItem,
    changeQuantity,
    removeItem,
    clearCart,
    syncError,
    isSyncing,
    syncNow,
    reloadCart,
  };
}
