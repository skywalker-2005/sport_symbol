import { useEffect, useState } from "react";
import { categories } from "../data/products.js";
import { apiRequest } from "../utils/api.js";
import { formatPrice } from "../utils.js";
import UiIcon from "./UiIcon.jsx";

const tabs = [
  ["products", "Товары и цены"],
  ["carts", "Корзины"],
  ["orders", "Заказы"],
  ["payments", "ЮKassa"],
];

export default function AdminPanel({ isOpen, onClose, onProductsChange }) {
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [carts, setCarts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [paymentSettings, setPaymentSettings] = useState({ configured: false, shopId: "" });
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    const load = async () => {
      setStatus("");
      try {
        if (tab === "products") {
          const result = await apiRequest("admin/products");
          if (active) setProducts(result.products);
        } else if (tab === "carts") {
          const result = await apiRequest("admin/carts");
          if (active) setCarts(result.carts);
        } else if (tab === "orders") {
          const result = await apiRequest("admin/orders");
          if (active) setOrders(result.orders);
        } else {
          const result = await apiRequest("admin/payment-settings");
          if (active) setPaymentSettings(result);
        }
      } catch (error) {
        if (active) setStatus(error.message);
      }
    };
    load();
    return () => { active = false; };
  }, [isOpen, tab]);

  if (!isOpen) return null;

  async function updatePrice(id, value) {
    setBusy(true);
    setStatus("");
    try {
      const { product } = await apiRequest(`admin/products/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ price: Number(value) }),
      });
      setProducts((current) => current.map((item) => item.id === id ? product : item));
      onProductsChange();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function addProduct(event) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const category = categories.find((item) => item.id === form.get("category"));
    try {
      const { product } = await apiRequest("admin/products", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          description: form.get("description"),
          category: category.id,
          categoryName: category.label,
          price: Number(form.get("price")),
          unit: form.get("unit"),
        }),
      });
      setProducts((current) => [...current, product]);
      formElement.reset();
      onProductsChange();
      setStatus("Товар добавлен");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function savePaymentSettings(event) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      const result = await apiRequest("admin/payment-settings", {
        method: "PUT",
        body: JSON.stringify({ shopId: form.get("shopId"), secretKey: form.get("secretKey") }),
      });
      setPaymentSettings(result);
      formElement.reset();
      setStatus("Настройки ЮKassa сохранены");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="checkout-overlay admin-overlay">
      <button className="cart-overlay__backdrop" type="button" onClick={onClose} aria-label="Закрыть панель" />
      <section className="admin-panel" role="dialog" aria-modal="true" aria-labelledby="admin-title">
        <header className="admin-panel__header">
          <div>
            <p className="eyebrow"><span /> УПРАВЛЕНИЕ МАГАЗИНОМ</p>
            <h2 id="admin-title">Панель администратора</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Закрыть"><UiIcon name="close" /></button>
        </header>
        <nav className="admin-tabs" aria-label="Разделы панели">
          {tabs.map(([id, label]) => (
            <button type="button" key={id} className={tab === id ? "is-active" : ""} onClick={() => setTab(id)}>{label}</button>
          ))}
        </nav>
        <div className="admin-panel__content">
          {tab === "products" && (
            <>
              <h3>Каталог и цены</h3>
              <div className="admin-products">
                {products.map((product) => (
                  <form className="admin-product" key={product.id} onSubmit={(event) => { event.preventDefault(); updatePrice(product.id, new FormData(event.currentTarget).get("price")); }}>
                    <span><b>{product.name}</b><small>{product.categoryName}</small></span>
                    <label className="admin-price">
                      <input key={`${product.id}-${product.price}`} name="price" type="number" min="0" max="100000000" step="1" defaultValue={product.price} required aria-label={`Цена товара ${product.name}`} />
                      <span>₽</span>
                    </label>
                    <button className="button button--red" type="submit" disabled={busy}>Сохранить</button>
                  </form>
                ))}
              </div>
              <h3 className="admin-subheading">Добавить товар</h3>
              <form className="checkout-form admin-add-product" onSubmit={addProduct}>
                <label>Название<input name="name" maxLength="120" required /></label>
                <label>Описание<input name="description" maxLength="500" required /></label>
                <div className="admin-form-row">
                  <label>Категория<select name="category">{categories.filter((item) => item.id !== "all").map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label>
                  <label>Цена, ₽<input name="price" type="number" min="0" max="100000000" step="1" required /></label>
                  <label>Единица<input name="unit" defaultValue="за шт." maxLength="40" required /></label>
                </div>
                <button className="button button--red" type="submit" disabled={busy}>Добавить товар</button>
              </form>
            </>
          )}
          {tab === "carts" && (
            <>
              <h3>Корзины покупателей <small>Включая неоплаченные</small></h3>
              <div className="admin-carts">
                {carts.length ? carts.map((cart) => (
                  <article className="admin-customer" key={cart.userId}>
                    <b>{cart.email}</b>
                    <small>Аккаунт создан: {new Date(cart.createdAt).toLocaleString("ru-RU")}</small>
                    {cart.items.length ? (
                      <ul>{cart.items.map((item) => <li key={item.productId}>{item.name} — {item.quantity} шт. × {formatPrice(item.price)} <small>(изменено {new Date(item.updatedAt).toLocaleString("ru-RU")})</small></li>)}</ul>
                    ) : <p>Корзина пуста</p>}
                  </article>
                )) : <p>Покупателей пока нет.</p>}
              </div>
            </>
          )}
          {tab === "orders" && (
            <>
              <h3>Последние заказы</h3>
              <div className="admin-carts">
                {orders.length ? orders.map((order) => (
                  <article className="admin-customer" key={order.id}>
                    <b>{order.customer_name} · {formatPrice(order.total)} · {order.status}</b>
                    <small>{order.email} · {order.phone} · {new Date(order.created_at).toLocaleString("ru-RU")}</small>
                    <ul>{order.items.map((item) => <li key={item.productId}>{item.name} — {item.quantity} шт.</li>)}</ul>
                  </article>
                )) : <p>Заказов пока нет.</p>}
              </div>
            </>
          )}
          {tab === "payments" && (
            <>
              <h3>Подключение ЮKassa</h3>
              <p className="admin-help">Секретный ключ шифруется на сервере и никогда не возвращается в браузер. Для сохранения ключей задайте PAYMENT_ENCRYPTION_KEY в переменных окружения Vercel.</p>
              <form className="checkout-form admin-payment-form" onSubmit={savePaymentSettings}>
                <label>Идентификатор магазина<input name="shopId" inputMode="numeric" pattern="[0-9]{1,20}" value={paymentSettings.shopId} onChange={(event) => setPaymentSettings((current) => ({ ...current, shopId: event.target.value }))} required /></label>
                <label>Секретный ключ<input name="secretKey" type="password" autoComplete="new-password" maxLength="256" placeholder={paymentSettings.configured ? "Оставьте пустым, чтобы не менять" : "Вставьте секретный ключ ЮKassa"} required={!paymentSettings.configured} /></label>
                <button className="button button--red" type="submit" disabled={busy}>Сохранить настройки</button>
              </form>
              <p className={paymentSettings.configured ? "admin-payment-state is-ready" : "admin-payment-state"}>
                {paymentSettings.configured ? "Данные магазина сохранены" : "Платежи пока не настроены"}
              </p>
              <p className="admin-help">URL уведомлений в кабинете ЮKassa: <code>{window.location.origin}/api/payments/webhook</code>. Включите события payment.succeeded и payment.canceled.</p>
            </>
          )}
          <p className="form-status form-status--error" role="status">{status}</p>
        </div>
      </section>
    </div>
  );
}
