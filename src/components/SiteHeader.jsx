import { useState } from "react";
import Brand from "./Brand.jsx";
import UiIcon from "./UiIcon.jsx";

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 4h2l2.2 11.1a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 2-1.6L21 8H6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="20" r="1" fill="currentColor" />
      <circle cx="18" cy="20" r="1" fill="currentColor" />
    </svg>
  );
}

const navigation = [
  ["Ассортимент", "#catalog"],
  ["Акции", "#offers"],
  ["О нас", "#about"],
  ["Контакты", "#contacts"],
];

export default function SiteHeader({ cartCount, onOpenCart, user, onOpenAuth, onOpenAdmin, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <>
      <div className="announcement">
        <div className="container announcement__inner">
          <span className="announcement__spark" aria-hidden="true">
            <UiIcon name="sparkle" />
          </span>
          <p>Каждое достижение заслуживает внимания</p>
          <a href="#catalog">
            Подобрать награды <span><UiIcon name="arrow-up-right" /></span>
          </a>
        </div>
      </div>

      <header className="site-header">
        <div className="container header__inner">
          <Brand />
          <button
            className="menu-toggle"
            type="button"
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
          </button>

          <nav
            className={`main-nav${menuOpen ? " is-open" : ""}`}
            aria-label="Основная навигация"
          >
            {navigation.map(([label, href]) => (
              <a href={href} key={href} onClick={closeMenu}>
                {label}
              </a>
            ))}
          </nav>

          <div className="header__actions">
            <a className="header__phone" href="tel:+74957785588">
              8 (495) 778-55-88
            </a>
            {user ? (
              <>
                {user.role === "admin" && (
                  <button className="account-button" type="button" onClick={onOpenAdmin}>Админ</button>
                )}
                <button className="account-button account-button--user" type="button" onClick={onLogout} title="Выйти">
                  <span className="account-button__email">{user.email}</span><span>Выйти</span>
                </button>
              </>
            ) : (
              <button className="account-button" type="button" onClick={onOpenAuth}>Войти</button>
            )}
            <button
              className="cart-button"
              type="button"
              onClick={onOpenCart}
              aria-label={`Открыть корзину, товаров: ${cartCount}`}
            >
              <CartIcon />
              <span>Корзина</span>
              <b className="cart-count">{cartCount}</b>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
