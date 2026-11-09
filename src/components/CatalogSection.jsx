import { useMemo, useState } from "react";
import { categories, products } from "../data/products.js";
import ProductCard from "./ProductCard.jsx";
import UiIcon from "./UiIcon.jsx";

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle
        cx="8.7"
        cy="8.7"
        r="5.8"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="m13 13 4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function CatalogSection({
  products,
  quantities,
  onAdd,
  onNotify,
}) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("ru-RU");
    return products.filter((product) => {
      const matchesCategory =
        activeCategory === "all" || product.category === activeCategory;
      const searchableText =
        `${product.name} ${product.categoryName} ${product.description}`.toLocaleLowerCase(
          "ru-RU",
        );
      return matchesCategory && searchableText.includes(query);
    });
  }, [activeCategory, products, search]);

  function addProduct(id) {
    onAdd(id);
    onNotify("Добавили в корзину");
  }

  return (
    <section className="catalog section" id="catalog">
      <div className="container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              <span /> НАЙДЁТСЯ ПОВОД ОТМЕТИТЬ
            </p>
            <h2>
              Выбирайте <em>свой символ</em>
            </h2>
          </div>
          <p className="section-heading__aside">
            Для личных рекордов и спортивных событий,
            <br />
            первого старта и большого турнира.
          </p>
        </div>

        <div className="catalog__toolbar">
          <div className="category-list" role="group" aria-label="Фильтр по категориям">
            {categories.map((category) => (
              <button
                className={`category-chip${activeCategory === category.id ? " is-active" : ""}`}
                type="button"
                key={category.id}
                aria-pressed={activeCategory === category.id}
                onClick={() => setActiveCategory(category.id)}
              >
                {category.label}
                {category.id === "all" && <span>{products.length}</span>}
              </button>
            ))}
          </div>
          <label className="catalog-search">
            <SearchIcon />
            <input
              type="search"
              placeholder="Найти награду"
              aria-label="Поиск по товарам"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>

        <div className="products-grid" aria-live="polite">
          {visibleProducts.length ? (
            visibleProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                quantity={quantities[product.id] || 0}
                onAdd={addProduct}
                index={index}
              />
            ))
          ) : (
            <div className="catalog-empty">
              <b>Ничего не нашлось</b>
              Попробуйте изменить запрос или выбрать другую категорию.
            </div>
          )}
        </div>

        <div className="catalog__foot">
          <p>Цены и изображения представлены для примера и будут уточнены.</p>
          <a className="text-link" href="#contacts">
            Нужен большой тираж? Обсудим <span><UiIcon name="arrow-up-right" /></span>
          </a>
        </div>
      </div>
    </section>
  );
}
