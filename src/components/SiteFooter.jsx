import Brand from "./Brand.jsx";

import UiIcon from "./UiIcon.jsx";

export default function SiteFooter() {
  return (
    <footer className="footer">
      <div className="container footer__top">
        <Brand footer />
        <p>Награды для достижений, которыми хочется гордиться.</p>
        <a href="#home" className="footer__top-link">
          Наверх <UiIcon name="arrow-up" />
        </a>
      </div>
      <div className="container footer__bottom">
        <span>© 2025–2026 Символ Спорта</span>
        <span>
          Цены и изображения на сайте — примеры. Уточняйте детали перед заказом.
        </span>
        <a href="mailto:hello@simvol-sporta.ru">hello@simvol-sporta.ru</a>
      </div>
    </footer>
  );
}
