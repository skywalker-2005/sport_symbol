import { useEffect, useState } from "react";
import { categories } from "../data/products.js";
import { API_BASE_URL, apiRequest } from "../utils/api.js";
import { formatPrice } from "../utils.js";
import UiIcon from "./UiIcon.jsx";

const tabs = [
  ["products", "Товары и цены"],
  ["carts", "Корзины"],
  ["orders", "Заказы"],
  ["payments", "ЮKassa"],
];

async function compressProductImage(file) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Выберите изображение JPEG, PNG или WebP");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Исходное изображение должно быть не больше 10 МБ");
  }

  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Не удалось обработать изображение");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const compressedImage = canvas.toDataURL("image/jpeg", 0.82);
    if (compressedImage.length > 1_400_000) {
      throw new Error("После сжатия изображение должно быть не больше 1 МБ");
    }
    return compressedImage;
  } finally {
    bitmap.close();
  }
}

export default function AdminPanel({ isOpen, onClose, onProductsChange }) {
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [carts, setCarts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [paymentSettings, setPaymentSettings] = useState({ configured: false, shopId: "" });
  const [status, setStatus] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageInputKey, setImageInputKey] = useState(0);

  function showError(message) {
    setStatus("");
    setAlertMessage(message);
  }

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
        if (active) showError(error.message);
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
      showError(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteProduct(product) {
    if (!window.confirm(`Удалить товар «${product.name}»?`)) return;
    setBusy(true);
    setStatus("");
    try {
      await apiRequest(`admin/products/${product.id}`, { method: "DELETE" });
      setProducts((current) => current.filter((item) => item.id !== product.id));
      onProductsChange();
      setStatus("Товар удален");
    } catch (error) {
      showError(error.message);
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
          imageUrl: imageUrl || null,
        }),
      });
      setProducts((current) => [...current, product]);
      formElement.reset();
      setImageUrl("");
      setImageInputKey((current) => current + 1);
      onProductsChange();
      setStatus("Товар добавлен");
    } catch (error) {
      showError(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function persistProductImage(product, nextImageUrl) {
    const { product: updatedProduct } = await apiRequest(`admin/products/${product.id}`, {
      method: "PATCH",
      body: JSON.stringify({ imageUrl: nextImageUrl }),
    });
    setProducts((current) => current.map((item) => item.id === product.id ? updatedProduct : item));
    onProductsChange();
  }

  async function selectProductImage(event, product = null) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) {
      if (!product) setImageUrl("");
      return;
    }

    setBusy(true);
    setStatus("");
    try {
      const compressedImage = await compressProductImage(file);
      if (product) {
        await persistProductImage(product, compressedImage);
        setStatus("Фото товара обновлено");
      } else {
        setImageUrl(compressedImage);
      }
    } catch (error) {
      showError(error.message || "Не удалось загрузить изображение");
    } finally {
      setBusy(false);
      input.value = "";
    }
  }

  async function removeProductImage(product) {
    setBusy(true);
    setStatus("");
    try {
      await persistProductImage(product, null);
      setStatus("Фото товара удалено");
    } catch (error) {
      showError(error.message);
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
      showError(error.message);
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
                    <span className="admin-product__info">
                      {product.imageUrl
                        ? <img className="admin-product__thumb" src={product.imageUrl} alt="" />
                        : null}
                      <span>
                        <b>{product.name}</b>
                        <small>{product.categoryName}</small>
                        <span className="admin-product__image-actions">
                          <label className="admin-photo-upload">
                            {product.imageUrl ? "Изменить фото" : "Добавить фото"}
                            <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} aria-label={`Выбрать фото товара ${product.name}`} onChange={(event) => selectProductImage(event, product)} />
                          </label>
                          {product.imageUrl && <button className="text-link admin-remove-photo" type="button" disabled={busy} onClick={() => removeProductImage(product)}>Удалить фото</button>}
                        </span>
                      </span>
                    </span>
                    <label className="admin-price">
                      <input key={`${product.id}-${product.price}`} name="price" type="number" min="0" max="100000000" step="1" defaultValue={product.price} required aria-label={`Цена товара ${product.name}`} />
                      <span>₽</span>
                    </label>
                    <div className="admin-product__actions">
                      <button className="button button--red" type="submit" disabled={busy}>Сохранить</button>
                      <button className="button button--delete" type="button" disabled={busy} onClick={() => deleteProduct(product)}>Удалить</button>
                    </div>
                  </form>
                ))}
              </div>
              <h3 className="admin-subheading">Добавить товар</h3>
              <form className="checkout-form admin-add-product" onSubmit={addProduct}>
                <div className="admin-add-product__fields">
                  <label>Название<input name="name" maxLength="120" required /></label>
                  <label className="admin-add-product__wide">Описание<input name="description" maxLength="500" required /></label>
                  <label>Категория<select name="category">{categories.filter((item) => item.id !== "all").map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label>
                  <label>Цена, ₽<input name="price" type="number" min="0" max="100000000" step="1" required /></label>
                  <label>Единица<input name="unit" defaultValue="за шт." maxLength="40" required /></label>
                  <label className="admin-image-upload admin-add-product__wide">
                    Фото товара
                    <input key={imageInputKey} name="image" type="file" accept="image/jpeg,image/png,image/webp" onChange={selectProductImage} />
                  </label>
                  {imageUrl && (
                    <div className="admin-image-preview admin-add-product__wide">
                      <img src={imageUrl} alt="Предпросмотр товара" />
                      <button type="button" className="text-link" onClick={() => {
                        setImageUrl("");
                        setImageInputKey((current) => current + 1);
                      }}>Убрать фото</button>
                    </div>
                  )}
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
              <p className="admin-help">Секретный ключ шифруется на сервере и никогда не возвращается в браузер. Для сохранения ключей задайте PAYMENT_ENCRYPTION_KEY в переменных окружения backend-сервиса.</p>
              <form className="checkout-form admin-payment-form" onSubmit={savePaymentSettings}>
                <label>Идентификатор магазина<input name="shopId" inputMode="numeric" pattern="[0-9]{1,20}" value={paymentSettings.shopId} onChange={(event) => setPaymentSettings((current) => ({ ...current, shopId: event.target.value }))} required /></label>
                <label>Секретный ключ<input name="secretKey" type="password" autoComplete="new-password" maxLength="256" placeholder={paymentSettings.configured ? "Оставьте пустым, чтобы не менять" : "Вставьте секретный ключ ЮKassa"} required={!paymentSettings.configured} /></label>
                <button className="button button--red" type="submit" disabled={busy}>Сохранить настройки</button>
              </form>
              <p className={paymentSettings.configured ? "admin-payment-state is-ready" : "admin-payment-state"}>
                {paymentSettings.configured ? "Данные магазина сохранены" : "Платежи пока не настроены"}
              </p>
              <p className="admin-help">URL уведомлений в кабинете ЮKassa: <code>{API_BASE_URL || window.location.origin}/api/payments/webhook</code>. Включите события payment.succeeded и payment.canceled.</p>
            </>
          )}
          <p className={`form-status ${["Товар добавлен", "Товар удален", "Фото товара обновлено", "Фото товара удалено", "Настройки ЮKassa сохранены"].includes(status) ? "form-status--success" : "form-status--error"}`} role="status">{status}</p>
        </div>
      </section>
      {alertMessage && (
        <div className="admin-alert-backdrop">
          <section className="admin-alert" role="alertdialog" aria-modal="true" aria-labelledby="admin-alert-title" aria-describedby="admin-alert-message">
            <h2 id="admin-alert-title">Не удалось выполнить действие</h2>
            <p id="admin-alert-message">{alertMessage}</p>
            <button className="button button--red" type="button" autoFocus onClick={() => setAlertMessage("")}>ОК</button>
          </section>
        </div>
      )}
    </div>
  );
}
