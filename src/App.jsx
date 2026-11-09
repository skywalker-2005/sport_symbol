import { useEffect, useRef, useState } from "react";
import AdminPanel from "./components/AdminPanel.jsx";
import AboutSection from "./components/AboutSection.jsx";
import AuthModal from "./components/AuthModal.jsx";
import BenefitsSection from "./components/BenefitsSection.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import CatalogSection from "./components/CatalogSection.jsx";
import CheckoutModal from "./components/CheckoutModal.jsx";
import ContactSection from "./components/ContactSection.jsx";
import HeroSection from "./components/HeroSection.jsx";
import PromoSection from "./components/PromoSection.jsx";
import SiteFooter from "./components/SiteFooter.jsx";
import SiteHeader from "./components/SiteHeader.jsx";
import StepsSection from "./components/StepsSection.jsx";
import { products as initialProducts } from "./data/products.js";
import { apiRequest } from "./utils/api.js";
import { useCart } from "./hooks/useCart.js";
import { formatPrice } from "./utils.js";

function mergeCatalog(products) {
  const byId = new Map(products.map((product) => [product.id, product]));
  return [
    ...initialProducts.map((product) => ({ ...product, ...byId.get(product.id) })),
    ...products.filter((product) => !initialProducts.some((initial) => initial.id === product.id)),
  ];
}

export default function App() {
  const [user, setUser] = useState(null);
  const [catalogProducts, setCatalogProducts] = useState(initialProducts);
  const cart = useCart(catalogProducts, user);
  const [paymentReturnId, setPaymentReturnId] = useState(
    () => new URLSearchParams(window.location.search).get("payment_id"),
  );
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [contactStatus, setContactStatus] = useState("");
  const [checkoutStatus, setCheckoutStatus] = useState("");
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [toast, setToast] = useState("");
  const checkoutKeyRef = useRef({ userId: null, key: "" });

  useEffect(() => {
    document.body.classList.toggle("is-locked", cartOpen || checkoutOpen || authOpen || adminOpen);
    return () => document.body.classList.remove("is-locked");
  }, [cartOpen, checkoutOpen, authOpen, adminOpen]);

  useEffect(() => {
    if (!cartOpen && !checkoutOpen && !authOpen && !adminOpen) return undefined;
    function handleEscape(event) {
      if (event.key === "Escape") {
        setCartOpen(false);
        setCheckoutOpen(false);
        setAuthOpen(false);
        setAdminOpen(false);
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [cartOpen, checkoutOpen, authOpen, adminOpen]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    apiRequest("auth/me")
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch((error) => setToast(error.message));
    apiRequest("products")
      .then(({ products }) => {
        setCatalogProducts(mergeCatalog(products));
      })
      .catch((error) => setToast(`Не удалось загрузить актуальный каталог: ${error.message}`));

    if (paymentReturnId) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!paymentReturnId || !user) return;
    let active = true;
    apiRequest(`payments/status?id=${encodeURIComponent(paymentReturnId)}`)
      .then(async ({ status }) => {
        if (!active) return;
        if (status === "canceled") await cart.reloadCart();
        if (active) {
          setToast(status === "paid"
            ? "Оплата прошла успешно. Спасибо за заказ!"
            : status === "canceled"
              ? "Платёж отменён. Корзина восстановлена."
              : "Платёж обрабатывается. Статус обновится после подтверждения ЮKassa.");
        }
      })
      .catch((error) => { if (active) setToast(error.message); })
      .finally(() => { if (active) setPaymentReturnId(null); });
    return () => { active = false; };
  }, [paymentReturnId, user?.id]);

  useEffect(() => {
    if (cart.syncError) setToast(`Корзина: ${cart.syncError}`);
  }, [cart.syncError]);

  function openCheckout() {
    if (cart.count === 0) {
      setToast("Добавьте товары в корзину");
      return;
    }
    setCartOpen(false);
    if (!user) {
      setAuthOpen(true);
      setToast("Войдите или зарегистрируйтесь, чтобы оформить заказ");
      return;
    }
    if (cart.isSyncing) {
      setToast("Подождите, синхронизируем корзину");
      return;
    }
    if (cart.syncError) {
      setToast(`Не удалось синхронизировать корзину: ${cart.syncError}`);
      return;
    }
    setCheckoutStatus("");
    setCheckoutOpen(true);
  }

  async function submitCheckout(customer) {
    setCheckoutBusy(true);
    setCheckoutStatus("");
    const storageKey = `simvol-sporta-payment:${user.id}`;
    let idempotencyKey = "";
    try {
      idempotencyKey = window.sessionStorage.getItem(storageKey) || "";
    } catch {
      idempotencyKey = checkoutKeyRef.current.userId === user.id ? checkoutKeyRef.current.key : "";
    }
    if (!/^[0-9a-f-]{36}$/i.test(idempotencyKey)) {
      idempotencyKey = window.crypto.randomUUID();
      try {
        window.sessionStorage.setItem(storageKey, idempotencyKey);
      } catch {
        // Keep the key in memory if this browser disables session storage.
      }
    }
    checkoutKeyRef.current = { userId: user.id, key: idempotencyKey };
    try {
      await cart.syncNow();
      const { confirmationUrl, paid } = await apiRequest("payments/create", {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({ ...customer, expectedTotal: cart.total }),
      });
      if (paid) {
        cart.clearCart();
        try {
          window.localStorage.removeItem(`simvol-sporta-cart:${user.id}`);
        } catch {
          // Server-side cart storage is authoritative.
        }
        try {
          window.sessionStorage.removeItem(storageKey);
        } catch {
          // Session storage is optional.
        }
        checkoutKeyRef.current = { userId: user.id, key: "" };
        setCheckoutOpen(false);
        setToast("Этот заказ уже оплачен. Спасибо!");
        return;
      }
      if (!confirmationUrl) throw new Error("ЮKassa не вернула ссылку для оплаты");
      cart.clearCart();
      try {
        window.localStorage.removeItem(`simvol-sporta-cart:${user.id}`);
      } catch {
        // Server-side cart storage is authoritative.
      }
      try {
        window.sessionStorage.removeItem(storageKey);
      } catch {
        // Session storage is optional.
      }
      checkoutKeyRef.current = { userId: user.id, key: "" };
      window.location.assign(confirmationUrl);
    } catch (error) {
      if (error.status === 409 && Number.isSafeInteger(error.data?.total)) {
        try {
          const { products } = await apiRequest("products");
          setCatalogProducts(mergeCatalog(products));
          setCheckoutStatus(`${error.message} Новая сумма: ${formatPrice(error.data.total)}.`);
        } catch (refreshError) {
          setCheckoutStatus(`${error.message} Не удалось обновить каталог: ${refreshError.message}`);
        }
      } else {
        setCheckoutStatus(error.message);
      }
      if (error.status === 502 || error.status === 409) {
        try {
          window.sessionStorage.removeItem(storageKey);
        } catch {
          // The in-memory key is still cleared below.
        }
        checkoutKeyRef.current = { userId: user.id, key: "" };
      }
    } finally {
      setCheckoutBusy(false);
    }
  }

  async function logout() {
    try {
      await apiRequest("auth/logout", { method: "POST" });
      if (user) {
        try {
          window.sessionStorage.removeItem(`simvol-sporta-payment:${user.id}`);
        } catch {
          // Session storage is optional; the authenticated cookie is cleared server-side.
        }
      }
      checkoutKeyRef.current = { userId: null, key: "" };
      setUser(null);
      setToast("Вы вышли из аккаунта");
    } catch (error) {
      setToast(error.message);
    }
  }

  return (
    <>
      <SiteHeader
        cartCount={cart.count}
        onOpenCart={() => setCartOpen(true)}
        user={user}
        onOpenAuth={() => setAuthOpen(true)}
        onOpenAdmin={() => setAdminOpen(true)}
        onLogout={logout}
      />
      <main>
        <HeroSection />
        <BenefitsSection />
        <CatalogSection
          products={catalogProducts}
          quantities={cart.quantities}
          onAdd={cart.addItem}
          onNotify={setToast}
        />
        <PromoSection />
        <AboutSection />
        <StepsSection />
        <ContactSection
          onSubmit={(message) => setContactStatus(message)}
          status={contactStatus}
        />
      </main>
      <SiteFooter />
      <CartDrawer
        isOpen={cartOpen}
        items={cart.items}
        count={cart.count}
        total={cart.total}
        isAuthenticated={Boolean(user)}
        onClose={() => setCartOpen(false)}
        onChangeQuantity={cart.changeQuantity}
        onRemove={(id) => {
          cart.removeItem(id);
          setToast("Удалили из корзины");
        }}
        onCheckout={openCheckout}
      />
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSubmit={submitCheckout}
        status={checkoutStatus}
        email={user?.email}
        busy={checkoutBusy}
      />
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} onAuthenticated={setUser} />
      <AdminPanel
        isOpen={adminOpen}
        onClose={() => setAdminOpen(false)}
        onProductsChange={() => apiRequest("products")
          .then(({ products }) => setCatalogProducts(mergeCatalog(products)))
          .catch((error) => setToast(error.message))}
      />
      <div className={`toast${toast ? " is-visible" : ""}`} role="status" aria-live="polite">
        {toast}
      </div>
    </>
  );
}
