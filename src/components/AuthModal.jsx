import { useState } from "react";
import { apiRequest } from "../utils/api.js";

const titles = {
  login: "С возвращением",
  register: "Создать аккаунт",
  "verify-email": "Подтвердите почту",
  "forgot-password": "Восстановление пароля",
  "reset-password": "Новый пароль",
};

export default function AuthModal({ isOpen, onClose, onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState("error");
  const [busy, setBusy] = useState(false);

  if (!isOpen) return null;

  function changeMode(nextMode) {
    setMode(nextMode);
    setStatus("");
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setStatus("");
    const form = new FormData(event.currentTarget);
    const formEmail = String(form.get("email") || email).trim().toLowerCase();
    setEmail(formEmail);
    try {
      if (mode === "login") {
        const { user } = await apiRequest("auth/login", {
          method: "POST",
          body: JSON.stringify({ email: formEmail, password: form.get("password") }),
        });
        onAuthenticated(user);
        onClose();
      } else if (mode === "register") {
        await apiRequest("auth/register", {
          method: "POST",
          body: JSON.stringify({
            email: formEmail,
            password: form.get("password"),
            adminSetupToken: form.get("adminSetupToken"),
          }),
        });
        changeMode("verify-email");
        setStatus("Мы отправили четырёхзначный код на вашу почту.");
        setStatusTone("success");
      } else if (mode === "verify-email") {
        const { user } = await apiRequest("auth/verify-email", {
          method: "POST",
          body: JSON.stringify({ email: formEmail, code: form.get("code") }),
        });
        onAuthenticated(user);
        onClose();
      } else if (mode === "forgot-password") {
        await apiRequest("auth/password/forgot", {
          method: "POST",
          body: JSON.stringify({ email: formEmail }),
        });
        changeMode("reset-password");
        setStatus("Если аккаунт существует, на его почту отправлен код.");
        setStatusTone("success");
      } else {
        await apiRequest("auth/password/reset", {
          method: "POST",
          body: JSON.stringify({
            email: formEmail,
            code: form.get("code"),
            password: form.get("password"),
          }),
        });
        changeMode("login");
        setStatus("Пароль изменён. Теперь войдите с новым паролем.");
        setStatusTone("success");
      }
    } catch (error) {
      if (mode === "register" && [502, 503].includes(error.status)) {
        changeMode("verify-email");
      }
      if (mode === "login" && error.status === 403) {
        changeMode("verify-email");
      }
      setStatus(error.message);
      setStatusTone("error");
    } finally {
      setBusy(false);
    }
  }

  async function resendVerificationCode() {
    setBusy(true);
    setStatus("");
    try {
      await apiRequest("auth/verification/resend", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setStatus("Если аккаунт ожидает подтверждения, новый код уже отправлен.");
      setStatusTone("success");
    } catch (error) {
      setStatus(error.message);
      setStatusTone("error");
    } finally {
      setBusy(false);
    }
  }

  const needsEmailInput = ["login", "register", "forgot-password"].includes(mode);
  const needsCode = ["verify-email", "reset-password"].includes(mode);

  return (
    <div className="checkout-overlay auth-overlay">
      <button className="cart-overlay__backdrop" type="button" onClick={onClose} aria-label="Закрыть окно" />
      <section className="checkout-modal auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="icon-button checkout-modal__close" type="button" onClick={onClose} aria-label="Закрыть"><UiIcon name="close" /></button>
        <p className="eyebrow"><span /> ЛИЧНЫЙ КАБИНЕТ</p>
        <h2 id="auth-title">{titles[mode]}</h2>
        <p>
          {mode === "login" && "Войдите, чтобы продолжить покупки и сохранить корзину."}
          {mode === "register" && "Корзина будет доступна на всех ваших устройствах. Для входа подтвердите почту."}
          {mode === "verify-email" && "Введите код из письма, чтобы подтвердить адрес электронной почты."}
          {mode === "forgot-password" && "Укажите почту аккаунта — мы отправим код для восстановления доступа."}
          {mode === "reset-password" && "Введите код из письма и задайте новый пароль."}
        </p>
        <form className="checkout-form" onSubmit={submit}>
          {needsEmailInput ? (
            <label>
              Электронная почта
              <input
                name="email"
                type="email"
                autoComplete="email"
                maxLength="254"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
          ) : (
            <p className="auth-email">Письмо отправлено на <b>{email}</b></p>
          )}

          {(mode === "login" || mode === "register") && (
            <label>
              Пароль
              <input
                name="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength="10"
                maxLength="128"
                required
              />
            </label>
          )}

          {mode === "register" && (
            <label>
              Код настройки администратора (если вы администратор)
              <input name="adminSetupToken" type="password" autoComplete="off" maxLength="256" />
            </label>
          )}

          {needsCode && (
            <label>
              Четырёхзначный код
              <input
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{4}"
                maxLength="4"
                required
              />
            </label>
          )}

          {mode === "reset-password" && (
            <label>
              Новый пароль
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                minLength="10"
                maxLength="128"
                required
              />
            </label>
          )}

          <button className="button button--red button--full" type="submit" disabled={busy}>
            {busy
              ? "Подождите…"
              : mode === "login"
                ? "Войти"
                : mode === "register"
                  ? "Зарегистрироваться"
                  : mode === "verify-email"
                    ? "Подтвердить почту"
                    : mode === "forgot-password"
                      ? "Отправить код"
                      : "Изменить пароль"}
          </button>
          <p className={`form-status form-status--${statusTone}`} role="status" aria-live="polite">{status}</p>
        </form>

        {mode === "login" && (
          <>
            <button className="auth-switch" type="button" onClick={() => changeMode("forgot-password")}>
              Забыли пароль?
            </button>
            <button className="auth-switch" type="button" onClick={() => changeMode("register")}>
              Нет аккаунта? Зарегистрироваться
            </button>
          </>
        )}
        {mode === "register" && (
          <button className="auth-switch" type="button" onClick={() => changeMode("login")}>
            Уже есть аккаунт? Войти
          </button>
        )}
        {mode === "verify-email" && (
          <>
            <button className="auth-switch" type="button" onClick={resendVerificationCode} disabled={busy}>
              Отправить код повторно
            </button>
            <button className="auth-switch" type="button" onClick={() => changeMode("login")}>
              Вернуться ко входу
            </button>
          </>
        )}
        {(mode === "forgot-password" || mode === "reset-password") && (
          <button className="auth-switch" type="button" onClick={() => changeMode("login")}>
            Вернуться ко входу
          </button>
        )}
      </section>
    </div>
  );
}
