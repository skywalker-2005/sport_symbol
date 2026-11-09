export default function CheckoutModal({ isOpen, onClose, onSubmit, status, email, busy }) {
  if (!isOpen) return null;

  function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({ name: form.get("name"), phone: form.get("phone") });
  }

  return (
    <div className="checkout-overlay">
      <button
        className="cart-overlay__backdrop"
        type="button"
        onClick={onClose}
        aria-label="Закрыть оформление"
      />
      <section
        className="checkout-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
      >
        <button
          className="icon-button checkout-modal__close"
          type="button"
          onClick={onClose}
          aria-label="Закрыть оформление"
        >
          ×
        </button>
        <p className="eyebrow">
          <span /> ПОСЛЕДНИЙ ШАГ
        </p>
        <h2 id="checkout-title">
          Оформление
          <br />
          <em>заказа</em>
        </h2>
        <p>
          Укажите имя и телефон. Данные заказа и актуальные цены проверяются
          сервером перед переходом к безопасной оплате.
        </p>
        <form className="checkout-form" onSubmit={handleSubmit}>
          <label>
            Ваше имя
            <input
              name="name"
              autoComplete="name"
              placeholder="Имя и фамилия"
              required
            />
          </label>
          <label>
            Телефон
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+7 (___) ___-__-__"
              required
            />
          </label>
          <label>
            Электронная почта аккаунта
            <input value={email || ""} readOnly />
          </label>
          <button className="button button--red button--full" type="submit" disabled={busy}>
            {busy ? "Создаём платёж…" : <>Перейти к оплате <span>↗</span></>}
          </button>
          <p className="form-status form-status--error" role="status" aria-live="polite">
            {status}
          </p>
        </form>
      </section>
    </div>
  );
}
