export default function CheckoutModal({ isOpen, onClose, onSubmit, status }) {
  if (!isOpen) return null;

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(
      "Спасибо! Это демонстрационная форма. Для приёма реальных заказов подключите сервер и обработчик заявок.",
    );
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
          Оставьте контакты — менеджер уточнит наличие, персонализацию и
          стоимость доставки. Это демо-форма: заказ и оплата пока не
          отправляются.
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
            Электронная почта
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.ru"
              required
            />
          </label>
          <button className="button button--red button--full" type="submit">
            Запросить подтверждение <span>↗</span>
          </button>
          <p className="form-status" role="status" aria-live="polite">
            {status}
          </p>
        </form>
      </section>
    </div>
  );
}
