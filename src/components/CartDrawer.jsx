import ProductArtwork from "./ProductArtwork.jsx";
import { formatPrice } from "../utils.js";

export default function CartDrawer({
  isOpen,
  items,
  count,
  total,
  onClose,
  onChangeQuantity,
  onRemove,
  onCheckout,
}) {
  if (!isOpen) return null;

  return (
    <div className="cart-overlay">
      <button
        className="cart-overlay__backdrop"
        type="button"
        onClick={onClose}
        aria-label="Закрыть корзину"
      />
      <aside
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
      >
        <div className="cart-drawer__header">
          <div>
            <p className="eyebrow">
              <span /> ВАШ ВЫБОР
            </p>
            <h2 id="cart-title">
              Корзина <span>({count})</span>
            </h2>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Закрыть корзину"
          >
            ×
          </button>
        </div>

        <div className="cart-drawer__items">
          {items.length ? (
            items.map(({ product, quantity }) => (
              <article className="cart-item" key={product.id}>
                <div
                  className="cart-item__visual"
                  style={{ "--visual-bg": product.background }}
                >
                  <ProductArtwork
                    type={product.visual}
                    id={`cart-${product.id}`}
                  />
                </div>
                <div>
                  <p className="cart-item__name">{product.name}</p>
                  <p className="cart-item__price">
                    {formatPrice(product.price)} / {product.unit}
                  </p>
                  <div className="cart-item__actions">
                    <div
                      className="quantity-control"
                      aria-label={`Количество: ${quantity}`}
                    >
                      <button
                        type="button"
                        onClick={() => onChangeQuantity(product.id, -1)}
                        aria-label="Уменьшить количество"
                      >
                        −
                      </button>
                      <span>{quantity}</span>
                      <button
                        type="button"
                        onClick={() => onChangeQuantity(product.id, 1)}
                        aria-label="Увеличить количество"
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="cart-item__remove"
                      type="button"
                      onClick={() => onRemove(product.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
                <b className="cart-item__sum">
                  {formatPrice(product.price * quantity)}
                </b>
              </article>
            ))
          ) : (
            <div className="cart-empty">
              <span className="cart-empty__icon">✳</span>
              <b>Пока здесь пусто</b>
              <p>Добавьте награды из каталога, и мы соберём ваш заказ.</p>
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-drawer__footer">
            <div className="cart-total">
              <span>Итого</span>
              <b>{formatPrice(total)}</b>
            </div>
            <p>Стоимость и наличие подтвердим при согласовании заказа.</p>
            <button
              className="button button--red button--full"
              type="button"
              onClick={onCheckout}
            >
              Перейти к оформлению <span>↗</span>
            </button>
            <span className="cart-demo-note">
              Оплата онлайн пока не подключена.
            </span>
          </div>
        )}
      </aside>
    </div>
  );
}
