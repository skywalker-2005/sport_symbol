import { createCipheriv, createDecipheriv, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import pg from "pg";
import { products as initialProducts } from "../src/data/products.js";

const { Pool } = pg;
const scrypt = promisify(scryptCallback);
function poolOptions() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return { max: 5 };
  const url = new URL(connectionString);
  const sslMode = url.searchParams.get("sslmode");
  const useSsl = process.env.NODE_ENV === "production" || (sslMode && sslMode !== "disable");
  for (const parameter of ["sslmode", "sslcert", "sslkey", "sslrootcert"]) {
    url.searchParams.delete(parameter);
  }
  return {
    connectionString: url.toString(),
    ssl: useSsl ? { rejectUnauthorized: true } : undefined,
    max: 5,
  };
}
const pool = new Pool(poolOptions());
let schemaPromise;

export async function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
          email_verified BOOLEAN NOT NULL DEFAULT TRUE,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT TRUE;
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '',
          category TEXT NOT NULL,
          category_name TEXT NOT NULL,
          price INTEGER NOT NULL CHECK (price >= 0),
          unit TEXT NOT NULL DEFAULT 'за шт.',
          badge TEXT NOT NULL DEFAULT '',
          visual TEXT NOT NULL DEFAULT 'cup',
          background TEXT NOT NULL DEFAULT 'linear-gradient(145deg,#ede7db,#d6c6ab)',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS cart_items (
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          product_id TEXT NOT NULL REFERENCES products(id),
          quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 99),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (user_id, product_id)
        );
        CREATE TABLE IF NOT EXISTS orders (
          id UUID PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id),
          email TEXT NOT NULL,
          customer_name TEXT NOT NULL,
          phone TEXT NOT NULL,
          items JSONB NOT NULL,
          total INTEGER NOT NULL CHECK (total > 0),
          status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'canceled', 'failed')),
          provider_payment_id TEXT UNIQUE,
          idempotency_key TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
        CREATE TABLE IF NOT EXISTS payment_settings (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          shop_id TEXT NOT NULL,
          encrypted_secret TEXT NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS auth_rate_limits (
          bucket TEXT PRIMARY KEY,
          attempts INTEGER NOT NULL,
          reset_at TIMESTAMPTZ NOT NULL
        );
        CREATE TABLE IF NOT EXISTS auth_codes (
          id UUID PRIMARY KEY,
          email TEXT NOT NULL,
          purpose TEXT NOT NULL CHECK (purpose IN ('verify-email', 'reset-password')),
          code_hash TEXT NOT NULL,
          attempts INTEGER NOT NULL DEFAULT 0,
          expires_at TIMESTAMPTZ NOT NULL,
          used_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS auth_codes_email_purpose_idx
          ON auth_codes(email, purpose, created_at DESC);
        CREATE INDEX IF NOT EXISTS cart_items_user_idx ON cart_items(user_id);
        CREATE INDEX IF NOT EXISTS orders_user_idx ON orders(user_id, created_at DESC);
        CREATE UNIQUE INDEX IF NOT EXISTS orders_user_idempotency_idx
          ON orders(user_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
      `);
      for (const product of initialProducts) {
        await pool.query(
          `INSERT INTO products (id, name, description, category, category_name, price, unit, badge, visual, background)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO NOTHING`,
          [product.id, product.name, product.description, product.category, product.categoryName,
            product.price, product.unit, product.badge, product.visual, product.background],
        );
      }
    })().catch((error) => {
      schemaPromise = undefined;
      throw error;
    });
  }
  await schemaPromise;
  return pool;
}

export function send(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}

export function fail(res, status, message) {
  send(res, status, { error: message });
}

export async function body(req) {
  if (req.body !== undefined) {
    const raw = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : req.body;
    if (Buffer.byteLength(typeof raw === "string" ? raw : JSON.stringify(raw)) > 16_384) {
      throw Object.assign(new Error("Слишком большой запрос"), { status: 413 });
    }
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
        return parsed;
      } catch {
        throw Object.assign(new Error("Некорректный JSON"), { status: 400 });
      }
    }
    if (raw && typeof raw === "object" && !Array.isArray(raw)) return raw;
    throw Object.assign(new Error("Некорректный JSON"), { status: 400 });
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 16_384) throw Object.assign(new Error("Слишком большой запрос"), { status: 413 });
    chunks.push(chunk);
  }
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    return parsed;
  } catch {
    throw Object.assign(new Error("Некорректный JSON"), { status: 400 });
  }
}

export function checkOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) throw Object.assign(new Error("Источник запроса не подтверждён"), { status: 403 });
  try {
    const originHost = new URL(origin).host;
    const requestHost = req.headers["x-forwarded-host"] || req.headers.host;
    if (originHost !== requestHost) throw new Error();
  } catch {
    throw Object.assign(new Error("Недопустимый источник запроса"), { status: 403 });
  }
}

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) throw new Error("JWT_SECRET must be at least 32 bytes");
  return secret;
}

function sign(payload) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const content = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const input = `${header}.${content}`;
  const signature = createHmac("sha256", jwtSecret()).update(input).digest("base64url");
  return `${input}.${signature}`;
}

export function setSession(res, user) {
  const token = sign({
    sub: user.id,
    role: user.role,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
  });
  res.setHeader("Set-Cookie", `session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`);
}

export function clearSession(res) {
  res.setHeader("Set-Cookie", "session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0");
}

export function getUser(req) {
  const token = (req.headers.cookie || "").split(";").map((part) => part.trim())
    .find((part) => part.startsWith("session="))?.slice(8);
  if (!token) return null;
  try {
    const [header, payload, signature] = token.split(".");
    if (!header || !payload || !signature) return null;
    const parsedHeader = JSON.parse(Buffer.from(header, "base64url").toString("utf8"));
    if (parsedHeader.alg !== "HS256") return null;
    const expected = createHmac("sha256", jwtSecret()).update(`${header}.${payload}`).digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!claims.sub || !claims.exp || claims.exp <= Date.now() / 1000) return null;
    return { id: claims.sub, email: claims.email, role: claims.role };
  } catch {
    return null;
  }
}

export function requireUser(req, res, role) {
  const user = getUser(req);
  if (!user) {
    fail(res, 401, "Войдите в аккаунт");
    return null;
  }
  if (role && user.role !== role) {
    fail(res, 403, "Недостаточно прав");
    return null;
  }
  return user;
}

export async function passwordHash(password) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

export async function verifyPassword(password, encoded) {
  const [saltHex, hashHex] = encoded.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function authCodeHash(email, purpose, code) {
  return createHmac("sha256", jwtSecret()).update(`${email}:${purpose}:${code}`).digest("hex");
}

export function verifyAuthCodeHash(email, purpose, code, encoded) {
  const expected = Buffer.from(encoded, "hex");
  const actual = Buffer.from(authCodeHash(email, purpose, code), "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function sendAuthCodeEmail(email, code, purpose) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    throw Object.assign(new Error("Отправка почты не настроена. Обратитесь к администратору."), { status: 503 });
  }
  const isVerification = purpose === "verify-email";
  let response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: isVerification ? "Подтверждение почты — Символ Спорта" : "Восстановление пароля — Символ Спорта",
        text: `${isVerification ? "Код подтверждения почты" : "Код для восстановления пароля"}: ${code}. Код действует 10 минут.`,
        html: `<p>${isVerification ? "Код подтверждения почты" : "Код для восстановления пароля"}:</p><p style="font-size:28px;font-weight:bold;letter-spacing:8px">${code}</p><p>Код действует 10 минут. Если вы не запрашивали это письмо, просто проигнорируйте его.</p>`,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw Object.assign(new Error("Не удалось отправить письмо. Попробуйте ещё раз позже."), { status: 502 });
  }
  if (!response.ok) {
    throw Object.assign(new Error("Почтовый сервис не принял письмо. Попробуйте ещё раз позже."), { status: 502 });
  }
}

export async function enforceRateLimit(database, key) {
  const bucket = createHmac("sha256", jwtSecret()).update(key).digest("hex");
  const result = await database.query(
    `INSERT INTO auth_rate_limits (bucket, attempts, reset_at)
     VALUES ($1, 1, NOW() + INTERVAL '15 minutes')
     ON CONFLICT (bucket) DO UPDATE SET
       attempts = CASE WHEN auth_rate_limits.reset_at <= NOW() THEN 1 ELSE auth_rate_limits.attempts + 1 END,
       reset_at = CASE WHEN auth_rate_limits.reset_at <= NOW() THEN NOW() + INTERVAL '15 minutes' ELSE auth_rate_limits.reset_at END
     RETURNING attempts`,
    [bucket],
  );
  if (result.rows[0].attempts > 10) throw Object.assign(new Error("Слишком много попыток. Попробуйте через 15 минут."), { status: 429 });
}

export function verifyAdminSetupToken(token) {
  const expectedValue = process.env.ADMIN_SETUP_TOKEN || "";
  const expected = Buffer.from(expectedValue);
  const actual = Buffer.from(typeof token === "string" ? token : "");
  return expected.length >= 32 && actual.length === expected.length && timingSafeEqual(actual, expected);
}

function encryptionKey() {
  const value = process.env.PAYMENT_ENCRYPTION_KEY || "";
  const key = /^[0-9a-f]{64}$/i.test(value) ? Buffer.from(value, "hex") : Buffer.from(value, "base64");
  if (key.length !== 32) throw new Error("PAYMENT_ENCRYPTION_KEY must be 32 bytes (base64 or hex)");
  return key;
}

export function encryptSecret(secret) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return `${iv.toString("base64")}.${cipher.getAuthTag().toString("base64")}.${encrypted.toString("base64")}`;
}

export function decryptSecret(value) {
  const [iv, tag, content] = value.split(".");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(content, "base64")), decipher.final()]).toString("utf8");
}

export async function getPaymentCredentials(database) {
  const result = await database.query("SELECT shop_id, encrypted_secret FROM payment_settings WHERE id = 1");
  if (!result.rowCount) throw Object.assign(new Error("Сначала настройте ЮKassa в панели администратора"), { status: 503 });
  return { shopId: result.rows[0].shop_id, secret: decryptSecret(result.rows[0].encrypted_secret) };
}

function validConfirmationUrl(value) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" ||
      !["yookassa.ru", "yoomoney.ru"].includes(url.hostname) ||
      !url.pathname.startsWith("/checkout/")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function refreshPayment(database, paymentId) {
  const order = await database.query(
    "SELECT id, user_id, items, total FROM orders WHERE provider_payment_id = $1",
    [paymentId],
  );
  if (!order.rowCount) throw Object.assign(new Error("Заказ платежа не найден"), { status: 404 });
  const credentials = await getPaymentCredentials(database);
  const response = await fetch(`https://api.yookassa.ru/v3/payments/${encodeURIComponent(paymentId)}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${credentials.shopId}:${credentials.secret}`).toString("base64")}`,
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw Object.assign(new Error("Не удалось проверить платёж в ЮKassa"), { status: 502 });
  const payment = await response.json();
  const orderId = order.rows[0].id;
  if (payment.metadata?.orderId !== orderId) {
    throw Object.assign(new Error("Платёж не соответствует заказу"), { status: 400 });
  }
  const amount = Number(payment.amount?.value);
  if (payment.currency !== "RUB" || Math.round(amount * 100) !== order.rows[0].total * 100) {
    throw Object.assign(new Error("Сумма или валюта платежа не совпадает с заказом"), { status: 400 });
  }
  const status = payment.status === "succeeded" && payment.paid === true
    ? "paid"
    : payment.status === "canceled" ? "canceled" : "pending";
  const client = await database.connect();
  try {
    await client.query("BEGIN");
    if (status === "canceled") {
      await client.query("SELECT id FROM users WHERE id = $1 FOR UPDATE", [order.rows[0].user_id]);
    }
    const updated = await client.query(
      "UPDATE orders SET status = $1 WHERE id = $2 AND status = 'pending' RETURNING user_id, items",
      [status, orderId],
    );
    if (status === "canceled" && updated.rowCount) {
      const items = Array.isArray(updated.rows[0].items) ? updated.rows[0].items : JSON.parse(updated.rows[0].items);
      for (const item of items) {
        await client.query(
          `INSERT INTO cart_items (user_id, product_id, quantity)
           VALUES ($1,$2,$3)
           ON CONFLICT (user_id, product_id) DO UPDATE SET
             quantity = LEAST(99, cart_items.quantity + EXCLUDED.quantity), updated_at = NOW()`,
          [updated.rows[0].user_id, item.productId, item.quantity],
        );
      }
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  return { orderId, status, confirmationUrl: validConfirmationUrl(payment.confirmation?.confirmation_url) };
}

export { validConfirmationUrl };
