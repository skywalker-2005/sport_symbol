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
        <span className="footer__legal">
          Индивидуальный предприниматель Щукин Олег Валерьевич · ИНН 772171824020 · ОГРНИП 325774600323142
        </span>
      </div>
    </footer>
  );
}
