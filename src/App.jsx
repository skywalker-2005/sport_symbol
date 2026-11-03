import { useEffect, useState } from "react";
import AboutSection from "./components/AboutSection.jsx";
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
import { useCart } from "./hooks/useCart.js";

export default function App() {
  const cart = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [contactStatus, setContactStatus] = useState("");
  const [checkoutStatus, setCheckoutStatus] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    document.body.classList.toggle("is-locked", cartOpen || checkoutOpen);
    return () => document.body.classList.remove("is-locked");
  }, [cartOpen, checkoutOpen]);

  useEffect(() => {
    if (!cartOpen && !checkoutOpen) return undefined;
    function handleEscape(event) {
      if (event.key === "Escape") {
        setCartOpen(false);
        setCheckoutOpen(false);
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [cartOpen, checkoutOpen]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function openCheckout() {
    if (cart.count === 0) {
      setToast("Добавьте товары в корзину");
      return;
    }
    setCartOpen(false);
    setCheckoutStatus("");
    setCheckoutOpen(true);
  }

  return (
    <>
      <SiteHeader cartCount={cart.count} onOpenCart={() => setCartOpen(true)} />
      <main>
        <HeroSection />
        <BenefitsSection />
        <CatalogSection
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
        onSubmit={setCheckoutStatus}
        status={checkoutStatus}
      />
      <div className={`toast${toast ? " is-visible" : ""}`} role="status" aria-live="polite">
        {toast}
      </div>
    </>
  );
}
