import { useState } from "react";
import { apiRequest } from "../utils/api.js";

export default function AuthModal({ isOpen, onClose, onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    const form = new FormData(event.currentTarget);
    try {
      const { user } = await apiRequest(`auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
          adminSetupToken: form.get("adminSetupToken"),
        }),
      });
      onAuthenticated(user);
      onClose();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="checkout-overlay auth-overlay">
      <button className="cart-overlay__backdrop" type="button" onClick={onClose} aria-label="Закрыть окно" />
      <section className="checkout-modal auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="icon-button checkout-modal__close" type="button" onClick={onClose} aria-label="Закрыть">×</button>
        <p className="eyebrow"><span /> ЛИЧНЫЙ КАБИНЕТ</p>
        <h2 id="auth-title">{mode === "login" ? "С возвращением" : "Создать аккаунт"}</h2>
        <p>{mode === "login" ? "Войдите, чтобы продолжить покупки и сохранить корзину." : "Корзина будет доступна на всех ваших устройствах."}</p>
        <form className="checkout-form" onSubmit={submit}>
          <label>
            Электронная почта
            <input name="email" type="email" autoComplete="email" maxLength="254" required />
          </label>
          <label>
            Пароль
            <input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength="10" maxLength="128" required />
          </label>
          {mode === "register" && (
            <label>
              Код настройки администратора (если вы администратор)
              <input name="adminSetupToken" type="password" autoComplete="off" maxLength="256" />
            </label>
          )}
          <button className="button button--red button--full" type="submit" disabled={busy}>
            {busy ? "Подождите…" : mode === "login" ? "Войти" : "Зарегистрироваться"}
          </button>
          <p className="form-status form-status--error" role="status">{status}</p>
        </form>
        <button className="auth-switch" type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setStatus(""); }}>
          {mode === "login" ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти"}
        </button>
      </section>
    </div>
  );
}
