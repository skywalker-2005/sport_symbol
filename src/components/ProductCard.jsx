import { useState } from "react";
import { formatPrice } from "../utils.js";
import ProductArtwork from "./ProductArtwork.jsx";
import UiIcon from "./UiIcon.jsx";

export default function ProductCard({ product, quantity, onAdd, index }) {
  const [favorite, setFavorite] = useState(false);
  const inCart = quantity > 0;

  return (
    <article
      className="product-card"
      style={{
        "--visual-bg": product.background,
        animationDelay: `${Math.min(index * 35, 245)}ms`,
      }}
    >
      <div className="product-card__visual">
        <span className="product-card__badge">{product.badge}</span>
        <button
          className={`product-card__favorite${favorite ? " is-active" : ""}`}
          type="button"
          aria-label={`${favorite ? "Убрать из" : "Добавить в"} избранное: ${product.name}`}
          aria-pressed={favorite}
          onClick={() => setFavorite((current) => !current)}
        >
          <UiIcon name={favorite ? "heart-filled" : "heart"} />
        </button>
        <ProductArtwork type={product.visual} id={product.id} />
      </div>
      <div className="product-card__body">
        <p className="product-card__category">{product.categoryName}</p>
        <h3>{product.name}</h3>
        <p className="product-card__description">{product.description}</p>
        <div className="product-card__bottom">
          <span className="product-card__price">
            {formatPrice(product.price)} <small>/ {product.unit}</small>
          </span>
          <button
            className={`product-card__add${inCart ? " is-added" : ""}`}
            type="button"
            onClick={() => onAdd(product.id)}
            aria-label={`Добавить в корзину: ${product.name}`}
          >
            {inCart ? "В корзине" : "В корзину"}
            <span aria-hidden="true">{inCart ? <UiIcon name="check" /> : "+"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
