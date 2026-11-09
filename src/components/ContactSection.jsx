import UiIcon from "./UiIcon.jsx";

export default function ContactSection({ onSubmit, status }) {
  function handleSubmit(event) {
    event.preventDefault();
    event.currentTarget.reset();
    onSubmit(
      "Спасибо за заявку! Сейчас форма работает как демо — подключите сервис отправки, чтобы получать обращения.",
    );
  }

  return (
    <section className="contact section" id="contacts">
      <div className="container contact__grid">
        <div>
          <p className="eyebrow eyebrow--light">
            <span /> ЕСТЬ ВОПРОС ИЛИ ИДЕЯ?
          </p>
          <h2>
            Давайте отметим
            <br />
            <em>то, что важно</em>
          </h2>
          <p className="contact__description">
            Расскажите, какое событие вы готовите. Поможем подобрать награды
            для любого результата.
          </p>
          <a className="contact__phone" href="tel:+78005553535">
            8 800 555-35-35 <span><UiIcon name="arrow-up-right" /></span>
          </a>
          <p className="contact__hours">
            Ежедневно, 9:00–18:00 · время московское
          </p>
        </div>
        <form className="contact-form" onSubmit={handleSubmit}>
          <label>
            Как к вам обращаться
            <input name="name" autoComplete="name" placeholder="Ваше имя" required />
          </label>
          <label>
            Телефон для связи
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+7 (___) ___-__-__"
              required
            />
          </label>
          <label>
            Что хотите отметить?
            <textarea
              name="message"
              rows="3"
              placeholder="Расскажите о событии и примерном тираже"
            />
          </label>
          <button className="button button--light" type="submit">
            Отправить заявку <span><UiIcon name="arrow-up-right" /></span>
          </button>
          <p className="contact-form__note">
            Нажимая кнопку, вы соглашаетесь на обработку персональных данных.
          </p>
          <p className="form-status" role="status" aria-live="polite">
            {status}
          </p>
        </form>
      </div>
    </section>
  );
}
