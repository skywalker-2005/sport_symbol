import { useState } from "react";
import { apiRequest } from "../utils/api.js";
import ContactLinks from "./ContactLinks.jsx";
import UiIcon from "./UiIcon.jsx";

export default function ContactSection() {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await apiRequest("contact", {
        method: "POST",
        body: JSON.stringify({
          name: data.get("name"),
          phone: data.get("phone"),
          message: data.get("message"),
        }),
      });
      form.reset();
      setStatus("Заявка отправлена. Мы скоро с вами свяжемся.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
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
          <a className="contact__phone" href="tel:+74957785588">
            8 (495) 778-55-88 <span><UiIcon name="arrow-up-right" /></span>
          </a>
          <p className="contact__hours">
            Телефон для связи
          </p>
          <address className="contact__addresses">
            <p><b>Магазин</b><br />Золоторожский Вал, 11с22<br />Спортивный центр «СимволСпорта»</p>
            <p><b>Склад</b><br />проезд Завода Серп и Молот, 12</p>
          </address>
          <p className="contact__messenger-note">Напишите нам: +7 (991) 136-92-30</p>
          <ContactLinks />
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
          <button className="button button--light" type="submit" disabled={busy}>
            {busy ? "Отправляем…" : <>Отправить заявку <span><UiIcon name="arrow-up-right" /></span></>}
          </button>
          <p className="contact-form__note">
            Нажимая кнопку, вы соглашаетесь на обработку персональных данных.
          </p>
          <p className={`form-status${status && !status.startsWith("Заявка отправлена") ? " form-status--error" : ""}`} role="status" aria-live="polite">
            {status}
          </p>
        </form>
      </div>
    </section>
  );
}
