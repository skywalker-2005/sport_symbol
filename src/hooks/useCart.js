import { useEffect, useMemo, useState } from "react";
import { products } from "../data/products.js";

const STORAGE_KEY = "simvol-sporta-cart";

function getInitialCart() {
  try {
    const storedCart = localStorage.getItem(STORAGE_KEY);
    if (!storedCart) return {};

    const parsedCart = JSON.parse(storedCart);
    if (!parsedCart || typeof parsedCart !== "object" || Array.isArray(parsedCart)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsedCart).filter(([id, quantity]) =>
        products.some((product) => product.id === id) &&
        Number.isInteger(quantity) &&
        quantity > 0,
      ),
    );
  } catch {
    return {};
  }
}

export function useCart() {
  const [quantities, setQuantities] = useState(getInitialCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quantities));
  }, [quantities]);

  const items = useMemo(
    () =>
      Object.entries(quantities)
        .map(([id, quantity]) => ({
          product: products.find((product) => product.id === id),
          quantity,
        }))
        .filter((item) => item.product),
    [quantities],
  );

  const count = items.reduce((total, item) => total + item.quantity, 0);
  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  function addItem(id) {
    setQuantities((current) => ({
      ...current,
      [id]: (current[id] || 0) + 1,
    }));
  }

  function changeQuantity(id, amount) {
    setQuantities((current) => {
      const next = (current[id] || 0) + amount;
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
  };
}
