export default function PromoSection() {
  return (
    <section className="promo section" id="offers">
      <div className="container">
        <div className="promo-card">
          <div className="promo-card__content">
            <p className="eyebrow eyebrow--light">
              <span /> ДЛЯ ЛЮБОГО СОБЫТИЯ
            </p>
            <h2>
              Отмечайте
              <br />
              каждый <em>шаг вперёд</em>
            </h2>
            <p>
              Соберите комплект наград для турнира или личного события —
              подберём медали и кубки в одном стиле.
            </p>
            <a className="button button--light" href="#contacts">
              Обсудить комплект <span>↗</span>
            </a>
          </div>
          <div className="promo-card__visual" aria-hidden="true">
            <span className="promo-card__ring" />
            <span className="promo-card__medal">
              <b>★</b>
              <i>МОЙ РЕКОРД</i>
            </span>
            <span className="promo-card__medal promo-card__medal--small">
              <b>✳</b>
              <i>МОЙ ШАГ</i>
            </span>
            <span className="promo-card__spark">✳</span>
            <span className="promo-card__sticker">
              ВАШЕ
              <br />
              СОБЫТИЕ
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
