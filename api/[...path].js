import { randomInt, randomUUID } from "node:crypto";
import {
  body,
  authCodeHash,
  checkOrigin,
  clearSession,
  db,
  encryptSecret,
  enforceRateLimit,
  fail,
  getPaymentCredentials,
  getUser,
  localAdminEmail,
  passwordHash,
  refreshPayment,
  requireUser,
  sendAuthCodeEmail,
  sendContactEmail,
  send,
  setSession,
  validConfirmationUrl,
  verifyAdminSetupToken,
  verifyAuthCodeHash,
  verifyPassword,
} from "../server/_lib.js";

function emailValue(value) {
  return typeof value === "string" && value.length <= 254
    ? value.trim().toLowerCase()
    : "";
}

function authCodeValue(value) {
  return typeof value === "string" && /^\d{4}$/.test(value) ? value : "";
}

async function issueAuthCode(database, email, purpose) {
  await database.query(
    "UPDATE auth_codes SET used_at = NOW() WHERE email = $1 AND purpose = $2 AND used_at IS NULL",
    [email, purpose],
  );
  const code = String(randomInt(0, 10_000)).padStart(4, "0");
  const id = randomUUID();
  await database.query(
    `INSERT INTO auth_codes (id, email, purpose, code_hash, expires_at)
     VALUES ($1,$2,$3,$4,NOW() + INTERVAL '10 minutes')`,
    [id, email, purpose, authCodeHash(email, purpose, code)],
  );
  try {
    return await sendAuthCodeEmail(email, code, purpose);
  } catch (error) {
    await database.query("UPDATE auth_codes SET used_at = NOW() WHERE id = $1", [id]);
    throw error;
  }
}

async function consumeAuthCode(database, email, purpose, code) {
  const result = await database.query(
    `UPDATE auth_codes SET attempts = attempts + 1
     WHERE id = (
       SELECT id FROM auth_codes
       WHERE email = $1 AND purpose = $2 AND used_at IS NULL
         AND expires_at > NOW() AND attempts < 5
       ORDER BY created_at DESC LIMIT 1
     )
       AND attempts < 5
     RETURNING id, code_hash`,
    [email, purpose],
  );
  if (!result.rowCount || !verifyAuthCodeHash(email, purpose, code, result.rows[0].code_hash)) {
    throw Object.assign(new Error("Неверный или просроченный код"), { status: 400 });
  }
  return result.rows[0].id;
}

function productShape(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    categoryName: row.category_name,
    price: row.price,
    unit: row.unit,
    badge: row.badge,
    visual: row.visual,
    background: row.background,
    imageUrl: row.image_url,
  };
}

async function getAdmin(req, res, database) {
  const user = requireUser(req, res, "admin");
  if (!user) return null;
  await database.query("SELECT id FROM users WHERE id = $1 AND role = 'admin'", [user.id])
    .then((result) => {
      if (!result.rowCount) throw Object.assign(new Error("Недостаточно прав"), { status: 403 });
    });
  return user;
}

async function handle(req, res) {
  const url = new URL(req.url, `https://${req.headers.host || "localhost"}`);
  const path = url.pathname.replace(/^\/api\/?/, "").replace(/\/+$/, "");
  const method = req.method || "GET";
  if (method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }
  if (path !== "payments/webhook" && method !== "GET") checkOrigin(req);

  if (path === "health" && method === "GET") {
    const checks = {
      database: Boolean(process.env.DATABASE_URL || process.env.LAYERO_DATABASE_URL),
      authentication: Boolean(process.env.JWT_SECRET && Buffer.byteLength(process.env.JWT_SECRET) >= 32),
      email: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
      localAuthCodes: process.env.NODE_ENV === "development" && process.env.LOCAL_DEV_ADMIN === "true",
      contactEmail: Boolean(process.env.CONTACT_EMAIL),
      paymentEncryption: Boolean(process.env.PAYMENT_ENCRYPTION_KEY),
    };
    if (!checks.database) {
      return send(res, 503, { ok: false, error: "Database URL is not configured", checks });
    }
    try {
      await (await db()).query("SELECT 1");
    } catch (error) {
      console.error("Health check database connection failed:", error);
      return send(res, 503, { ok: false, error: "Database connection failed", checks: { ...checks, database: false } });
    }
    return send(res, 200, { ok: true, checks });
  }

  const database = await db();

  if (path === "contact" && method === "POST") {
    const data = await body(req);
    const name = typeof data.name === "string" ? data.name.trim() : "";
    const phone = typeof data.phone === "string" ? data.phone.trim() : "";
    const message = typeof data.message === "string" ? data.message.trim() : "";
    if (!name || name.length > 120 || !/^[+()\d\s-]{7,25}$/.test(phone) || message.length > 1500) {
      return fail(res, 400, "Проверьте имя, телефон и длину сообщения");
    }
    const forwardedFor = req.headers["x-forwarded-for"];
    const clientIp = typeof forwardedFor === "string"
      ? forwardedFor.split(",")[0].trim()
      : req.socket?.remoteAddress || "unknown";
    await enforceRateLimit(database, `contact:${clientIp}`);
    await sendContactEmail({ name, phone, message });
    return send(res, 200, { ok: true });
  }

  if (path === "products" && method === "GET") {
    const result = await database.query("SELECT * FROM products ORDER BY created_at, id");
    return send(res, 200, { products: result.rows.map(productShape) });
  }

  if (path === "auth/register" && method === "POST") {
    const data = await body(req);
    const email = emailValue(data.email);
    const password = typeof data.password === "string" ? data.password : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(res, 400, "Введите корректную почту");
    if (password.length < 10 || password.length > 128) return fail(res, 400, "Пароль должен содержать от 10 до 128 символов");
    await enforceRateLimit(database, `register:${email}`);
    const isAdminEmail = process.env.ADMIN_EMAIL && email === emailValue(process.env.ADMIN_EMAIL);
    if (isAdminEmail && !verifyAdminSetupToken(data.adminSetupToken)) {
      return fail(res, 403, "Для первичной регистрации администратора нужен код настройки");
    }
    const role = isAdminEmail ? "admin" : "customer";
    const result = await database.query(
      `INSERT INTO users (id, email, password_hash, role, email_verified) VALUES ($1,$2,$3,$4,FALSE)
       ON CONFLICT (email) DO NOTHING RETURNING id, email, role`,
      [randomUUID(), email, await passwordHash(password), role],
    );
    if (!result.rowCount) {
      const existing = await database.query("SELECT email_verified FROM users WHERE email = $1", [email]);
      if (!existing.rowCount || existing.rows[0].email_verified) {
        return fail(res, 409, "Аккаунт с этой почтой уже существует");
      }
    }
    const codeLoggedLocally = await issueAuthCode(database, email, "verify-email");
    return send(res, result.rowCount ? 201 : 200, { verificationRequired: true, codeLoggedLocally });
  }

  if (path === "auth/login" && method === "POST") {
    const data = await body(req);
    const email = emailValue(data.email);
    const password = typeof data.password === "string" ? data.password : "";
    if (process.env.TUNNEL_MODE === "true" && email === localAdminEmail) {
      return fail(res, 401, "Неверная почта или пароль");
    }
    await enforceRateLimit(database, `login:${email}`);
    const result = await database.query(
      "SELECT id, email, password_hash, role, email_verified FROM users WHERE email = $1",
      [email],
    );
    const encoded = result.rows[0]?.password_hash || `${"00".repeat(16)}:${"00".repeat(64)}`;
    const valid = password.length <= 128 && await verifyPassword(password, encoded);
    if (!result.rowCount || !valid) return fail(res, 401, "Неверная почта или пароль");
    if (!result.rows[0].email_verified) return fail(res, 403, "Подтвердите почту кодом из письма");
    setSession(res, result.rows[0]);
    return send(res, 200, { user: { id: result.rows[0].id, email, role: result.rows[0].role } });
  }

  if (path === "auth/verification/resend" && method === "POST") {
    const data = await body(req);
    const email = emailValue(data.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(res, 400, "Введите корректную почту");
    await enforceRateLimit(database, `verification-resend:${email}`);
    const user = await database.query("SELECT id FROM users WHERE email = $1 AND email_verified = FALSE", [email]);
    const codeLoggedLocally = user.rowCount
      ? await issueAuthCode(database, email, "verify-email")
      : false;
    return send(res, 200, { ok: true, codeLoggedLocally });
  }

  if (path === "auth/verify-email" && method === "POST") {
    const data = await body(req);
    const email = emailValue(data.email);
    const code = authCodeValue(data.code);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !code) return fail(res, 400, "Введите почту и четырёхзначный код");
    await enforceRateLimit(database, `verify-email:${email}`);
    const codeId = await consumeAuthCode(database, email, "verify-email", code);
    const client = await database.connect();
    let user;
    try {
      await client.query("BEGIN");
      const consumed = await client.query(
        "UPDATE auth_codes SET used_at = NOW() WHERE id = $1 AND used_at IS NULL RETURNING id",
        [codeId],
      );
      if (!consumed.rowCount) {
        await client.query("ROLLBACK");
        return fail(res, 400, "Неверный или просроченный код");
      }
      const verified = await client.query(
        "UPDATE users SET email_verified = TRUE WHERE email = $1 RETURNING id, email, role",
        [email],
      );
      if (!verified.rowCount) {
        await client.query("ROLLBACK");
        return fail(res, 400, "Аккаунт не найден");
      }
      await client.query(
        "UPDATE auth_codes SET used_at = NOW() WHERE email = $1 AND purpose = 'verify-email' AND used_at IS NULL",
        [email],
      );
      await client.query("COMMIT");
      user = verified.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    setSession(res, user);
    return send(res, 200, { user });
  }

  if (path === "auth/password/forgot" && method === "POST") {
    const data = await body(req);
    const email = emailValue(data.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(res, 400, "Введите корректную почту");
    await enforceRateLimit(database, `password-forgot:${email}`);
    const user = await database.query("SELECT id FROM users WHERE email = $1", [email]);
    const codeLoggedLocally = user.rowCount
      ? await issueAuthCode(database, email, "reset-password")
      : false;
    return send(res, 200, { ok: true, codeLoggedLocally });
  }

  if (path === "auth/password/reset" && method === "POST") {
    const data = await body(req);
    const email = emailValue(data.email);
    const code = authCodeValue(data.code);
    const password = typeof data.password === "string" ? data.password : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !code) {
      return fail(res, 400, "Введите почту и четырёхзначный код");
    }
    if (password.length < 10 || password.length > 128) {
      return fail(res, 400, "Пароль должен содержать от 10 до 128 символов");
    }
    await enforceRateLimit(database, `password-reset:${email}`);
    const codeId = await consumeAuthCode(database, email, "reset-password", code);
    const hash = await passwordHash(password);
    const client = await database.connect();
    try {
      await client.query("BEGIN");
      const consumed = await client.query(
        "UPDATE auth_codes SET used_at = NOW() WHERE id = $1 AND used_at IS NULL RETURNING id",
        [codeId],
      );
      if (!consumed.rowCount) {
        await client.query("ROLLBACK");
        return fail(res, 400, "Неверный или просроченный код");
      }
      const updated = await client.query(
        "UPDATE users SET password_hash = $1, email_verified = TRUE WHERE email = $2 RETURNING id",
        [hash, email],
      );
      if (!updated.rowCount) {
        await client.query("ROLLBACK");
        return fail(res, 400, "Аккаунт не найден");
      }
      await client.query(
        "UPDATE auth_codes SET used_at = NOW() WHERE email = $1 AND purpose = 'reset-password' AND used_at IS NULL",
        [email],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    return send(res, 200, { ok: true });
  }

  if (path === "auth/me" && method === "GET") {
    const tokenUser = getUser(req);
    if (!tokenUser) return send(res, 200, { user: null });
    const result = await database.query("SELECT id, email, role FROM users WHERE id = $1", [tokenUser.id]);
    if (!result.rowCount) return send(res, 200, { user: null });
    return send(res, 200, { user: result.rows[0] });
  }

  if (path === "auth/logout" && method === "POST") {
    clearSession(res);
    return send(res, 200, { ok: true });
  }

  if (path === "cart" && method === "GET") {
    const user = requireUser(req, res);
    if (!user) return;
    const result = await database.query(
      "SELECT product_id, quantity FROM cart_items WHERE user_id = $1 ORDER BY product_id",
      [user.id],
    );
    return send(res, 200, { items: Object.fromEntries(result.rows.map((row) => [row.product_id, row.quantity])) });
  }

  if (path === "cart" && method === "PUT") {
    const user = requireUser(req, res);
    if (!user) return;
    const data = await body(req);
    if (!Array.isArray(data.items) || data.items.length > 100) return fail(res, 400, "Некорректная корзина");
    const lines = new Map();
    for (const item of data.items) {
      if (!item || typeof item.productId !== "string" || !Number.isInteger(item.quantity) ||
        item.quantity < 1 || item.quantity > 99) return fail(res, 400, "Некорректный товар в корзине");
      lines.set(item.productId, item.quantity);
    }
    const foundProducts = await database.query("SELECT id FROM products WHERE id = ANY($1::text[])", [[...lines.keys()]]);
    if (foundProducts.rowCount !== lines.size) return fail(res, 400, "В корзине есть неизвестный товар");
    const client = await database.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT id FROM users WHERE id = $1 FOR UPDATE", [user.id]);
      await client.query("DELETE FROM cart_items WHERE user_id = $1", [user.id]);
      for (const [productId, quantity] of lines) {
        await client.query(
          `INSERT INTO cart_items (user_id, product_id, quantity)
           SELECT $1, id, $3 FROM products WHERE id = $2`,
          [user.id, productId, quantity],
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    return send(res, 200, { ok: true });
  }

  if (path === "admin/products" && method === "GET") {
    if (!await getAdmin(req, res, database)) return;
    const result = await database.query("SELECT * FROM products ORDER BY created_at, id");
    return send(res, 200, { products: result.rows.map(productShape) });
  }

  if (path === "admin/products" && method === "POST") {
    if (!await getAdmin(req, res, database)) return;
    const data = await body(req, 2_000_000);
    const name = typeof data.name === "string" ? data.name.trim() : "";
    const description = typeof data.description === "string" ? data.description.trim() : "";
    const category = typeof data.category === "string" ? data.category : "awards";
    const categoryName = typeof data.categoryName === "string" ? data.categoryName.trim() : "";
    const price = data.price;
    const unit = typeof data.unit === "string" ? data.unit.trim() : "за шт.";
    const imageUrl = typeof data.imageUrl === "string" ? data.imageUrl : null;
    if (imageUrl !== null) {
      const imageMatch = imageUrl.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
      if (!imageMatch || Buffer.from(imageMatch[2], "base64").length > 1_000_000) {
        return fail(res, 400, "Загрузите изображение JPEG, PNG или WebP размером до 1 МБ после сжатия");
      }
    }
    if (!name || name.length > 120 || description.length > 500 ||
      !["cups", "awards", "medals", "plaques", "figures", "bases", "print"].includes(category) || !categoryName ||
      categoryName.length > 80 || !Number.isSafeInteger(price) || price < 0 || price > 100000000 ||
      !unit || unit.length > 40) return fail(res, 400, "Проверьте название, категорию и цену товара");
    const id = `custom-${randomUUID()}`;
    const result = await database.query(
      `INSERT INTO products (id, name, description, category, category_name, price, unit, badge, visual, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'Новинка','cup',$8) RETURNING *`,
      [id, name, description, category, categoryName, price, unit, imageUrl],
    );
    return send(res, 201, { product: productShape(result.rows[0]) });
  }

  const priceMatch = path.match(/^admin\/products\/([a-z0-9-]+)$/);
  if (priceMatch && method === "DELETE") {
    if (!await getAdmin(req, res, database)) return;
    const client = await database.connect();
    try {
      await client.query("BEGIN");
      const existing = await client.query("SELECT id FROM products WHERE id = $1 FOR UPDATE", [priceMatch[1]]);
      if (!existing.rowCount) {
        await client.query("ROLLBACK");
        return fail(res, 404, "Товар не найден");
      }
      await client.query("DELETE FROM cart_items WHERE product_id = $1", [priceMatch[1]]);
      await client.query("DELETE FROM products WHERE id = $1", [priceMatch[1]]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    return send(res, 200, { ok: true });
  }
  if (priceMatch && method === "PATCH") {
    if (!await getAdmin(req, res, database)) return;
    const data = await body(req);
    const price = data.price;
    if (!Number.isSafeInteger(price) || price < 0 || price > 100000000) return fail(res, 400, "Укажите корректную цену в рублях");
    const result = await database.query("UPDATE products SET price = $1 WHERE id = $2 RETURNING *", [price, priceMatch[1]]);
    if (!result.rowCount) return fail(res, 404, "Товар не найден");
    return send(res, 200, { product: productShape(result.rows[0]) });
  }

  if (path === "admin/carts" && method === "GET") {
    if (!await getAdmin(req, res, database)) return;
    const result = await database.query(`
      SELECT u.id AS user_id, u.email, u.created_at AS user_created_at,
             c.product_id, c.quantity, c.updated_at AS cart_updated_at,
             p.name, p.price
      FROM users u
      LEFT JOIN cart_items c ON c.user_id = u.id
      LEFT JOIN products p ON p.id = c.product_id
      WHERE u.role = 'customer'
      ORDER BY u.created_at DESC, u.email, p.name
    `);
    const carts = new Map();
    for (const row of result.rows) {
      if (!carts.has(row.user_id)) carts.set(row.user_id, {
        userId: row.user_id, email: row.email, createdAt: row.user_created_at, items: [],
      });
      if (row.product_id) carts.get(row.user_id).items.push({
        productId: row.product_id, name: row.name, price: row.price,
        quantity: row.quantity, updatedAt: row.cart_updated_at,
      });
    }
    return send(res, 200, { carts: [...carts.values()] });
  }

  if (path === "admin/orders" && method === "GET") {
    if (!await getAdmin(req, res, database)) return;
    const result = await database.query(
      "SELECT id, email, customer_name, phone, items, total, status, created_at FROM orders ORDER BY created_at DESC LIMIT 200",
    );
    return send(res, 200, { orders: result.rows });
  }

  if (path === "admin/payment-settings" && method === "GET") {
    if (!await getAdmin(req, res, database)) return;
    const result = await database.query("SELECT shop_id FROM payment_settings WHERE id = 1");
    return send(res, 200, { configured: Boolean(result.rowCount), shopId: result.rows[0]?.shop_id || "" });
  }

  if (path === "admin/payment-settings" && method === "PUT") {
    if (!await getAdmin(req, res, database)) return;
    const data = await body(req);
    const shopId = typeof data.shopId === "string" ? data.shopId.trim() : "";
    const secret = typeof data.secretKey === "string" ? data.secretKey.trim() : "";
    if (!/^\d{1,20}$/.test(shopId) || shopId.length > 20 || (secret && secret.length > 256)) {
      return fail(res, 400, "Проверьте идентификатор магазина и секретный ключ");
    }
    const existing = await database.query("SELECT encrypted_secret FROM payment_settings WHERE id = 1");
    if (!secret && !existing.rowCount) return fail(res, 400, "Для первой настройки введите секретный ключ");
    const encryptedSecret = secret ? encryptSecret(secret) : existing.rows[0].encrypted_secret;
    await database.query(
      `INSERT INTO payment_settings (id, shop_id, encrypted_secret) VALUES (1,$1,$2)
       ON CONFLICT (id) DO UPDATE SET shop_id = EXCLUDED.shop_id,
         encrypted_secret = EXCLUDED.encrypted_secret, updated_at = NOW()`,
      [shopId, encryptedSecret],
    );
    return send(res, 200, { configured: true, shopId });
  }

  if (path === "payments/create" && method === "POST") {
    const user = requireUser(req, res);
    if (!user) return;
    const data = await body(req);
    const idempotencyKey = req.headers["idempotency-key"];
    const customerName = typeof data.name === "string" ? data.name.trim() : "";
    const phone = typeof data.phone === "string" ? data.phone.trim() : "";
    if (typeof idempotencyKey !== "string" || !/^[0-9a-f-]{36}$/i.test(idempotencyKey)) {
      return fail(res, 400, "Не удалось подтвердить повторный запрос. Обновите страницу и попробуйте снова.");
    }
    if (!Number.isSafeInteger(data.expectedTotal) || data.expectedTotal < 0) {
      return fail(res, 400, "Не удалось проверить сумму корзины. Обновите страницу и повторите попытку.");
    }
    if (!customerName || customerName.length > 120 || !/^[+()\d\s-]{7,25}$/.test(phone)) {
      return fail(res, 400, "Введите имя и корректный номер телефона");
    }
    const credentials = await getPaymentCredentials(database);
    const client = await database.connect();
    let order;
    try {
      await client.query("BEGIN");
      await client.query("SELECT id FROM users WHERE id = $1 FOR UPDATE", [user.id]);
      const previous = await client.query(
        `SELECT id, customer_name, phone, items, total, status, provider_payment_id, idempotency_key
         FROM orders WHERE user_id = $1 AND idempotency_key = $2`,
        [user.id, idempotencyKey],
      );
      if (previous.rowCount) {
        order = previous.rows[0];
      } else {
        const pending = await client.query(
          `SELECT id, customer_name, phone, items, total, status, provider_payment_id, idempotency_key
           FROM orders WHERE user_id = $1 AND status = 'pending'
           ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
          [user.id],
        );
        if (pending.rowCount) {
          order = pending.rows[0];
          await client.query("UPDATE orders SET idempotency_key = $1 WHERE id = $2", [idempotencyKey, order.id]);
        } else {
          const cart = await client.query(
            `SELECT c.product_id, c.quantity, p.name, p.price, p.unit
             FROM cart_items c JOIN products p ON p.id = c.product_id
             WHERE c.user_id = $1 ORDER BY p.id FOR SHARE OF p`,
            [user.id],
          );
          if (!cart.rowCount) {
            await client.query("ROLLBACK");
            return fail(res, 400, "Корзина пуста");
          }
          const items = cart.rows.map((item) => ({
            productId: item.product_id, name: item.name, price: item.price,
            unit: item.unit, quantity: item.quantity,
          }));
          const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
          if (!Number.isSafeInteger(total) || total < 1 || total > 2_000_000_000) {
            await client.query("ROLLBACK");
            return fail(res, 400, "Сумма заказа превышает допустимый предел");
          }
          if (data.expectedTotal !== total) {
            await client.query("ROLLBACK");
            return send(res, 409, {
              error: "Цены каталога изменились. Проверьте обновлённую сумму и повторите оформление.",
              total,
            });
          }
          order = {
            id: randomUUID(),
            customer_name: customerName,
            phone,
            items,
            total,
            status: "pending",
            provider_payment_id: null,
          };
          await client.query(
            `INSERT INTO orders
             (id, user_id, email, customer_name, phone, items, total, status, idempotency_key)
             VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',$8)`,
            [order.id, user.id, user.email, customerName, phone, JSON.stringify(items), total, idempotencyKey],
          );
          await client.query("DELETE FROM cart_items WHERE user_id = $1", [user.id]);
        }
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
    if (order.status === "paid") return send(res, 200, { orderId: order.id, paid: true });
    if (order.status !== "pending") return fail(res, 409, "Этот заказ уже закрыт. Повторите оформление.");
    if (order.provider_payment_id) {
      const existingPayment = await refreshPayment(database, order.provider_payment_id);
      if (existingPayment.status === "paid") return send(res, 200, { orderId: order.id, paid: true });
      if (existingPayment.status !== "pending") return fail(res, 409, "Платёж отменён. Создайте новый заказ.");
      if (existingPayment.confirmationUrl) {
        return send(res, 200, { orderId: order.id, confirmationUrl: existingPayment.confirmationUrl });
      }
    }
    const origin = req.headers.origin || `https://${req.headers["x-forwarded-host"] || req.headers.host}`;
    const returnUrl = new URL("/", origin);
    returnUrl.searchParams.set("payment_id", order.id);
    const orderItems = Array.isArray(order.items) ? order.items : JSON.parse(order.items);
    let response;
    try {
      response = await fetch("https://api.yookassa.ru/v3/payments", {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${credentials.shopId}:${credentials.secret}`).toString("base64")}`,
          "Content-Type": "application/json",
          "Idempotence-Key": order.id,
        },
        body: JSON.stringify({
          amount: { value: order.total.toFixed(2), currency: "RUB" },
          capture: true,
          confirmation: { type: "redirect", return_url: returnUrl.toString() },
          description: `Заказ ${order.id}`,
          metadata: { orderId: order.id },
        }),
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      throw Object.assign(new Error("Результат запроса в ЮKassa неизвестен. Повторите попытку, не меняя заказ."), { status: 503 });
    }
    const payment = await response.json().catch(() => ({}));
    if (response.status >= 500) {
      throw Object.assign(new Error("ЮKassa временно недоступна. Повторите попытку, не меняя заказ."), { status: 503 });
    }
    const confirmationUrl = validConfirmationUrl(payment.confirmation?.confirmation_url);
    if (!response.ok || !payment.id || !confirmationUrl) {
      if (response.ok) {
        throw Object.assign(new Error("ЮKassa вернула некорректный ответ. Повторите попытку, не меняя заказ."), { status: 503 });
      }
      const restore = await database.connect();
      try {
        await restore.query("BEGIN");
        await restore.query("SELECT id FROM users WHERE id = $1 FOR UPDATE", [user.id]);
        const failed = await restore.query(
          "UPDATE orders SET status = 'failed' WHERE id = $1 AND status = 'pending' RETURNING id",
          [order.id],
        );
        if (failed.rowCount) {
          for (const item of orderItems) {
            await restore.query(
              `INSERT INTO cart_items (user_id, product_id, quantity)
               VALUES ($1,$2,$3)
               ON CONFLICT (user_id, product_id) DO UPDATE SET
                 quantity = LEAST(99, cart_items.quantity + EXCLUDED.quantity), updated_at = NOW()`,
              [user.id, item.productId, item.quantity],
            );
          }
        }
        await restore.query("COMMIT");
      } catch (error) {
        await restore.query("ROLLBACK");
        throw error;
      } finally {
        restore.release();
      }
      return fail(res, 502, "ЮKassa отклонила создание платежа. Проверьте ключи и настройки магазина.");
    }
    if (payment.metadata?.orderId !== order.id || payment.currency !== "RUB" ||
      Math.round(Number(payment.amount?.value) * 100) !== order.total * 100) {
      throw Object.assign(new Error("Параметры платежа ЮKassa не совпали с заказом. Повторите попытку, не меняя заказ."), { status: 503 });
    }
    await database.query("UPDATE orders SET provider_payment_id = $1 WHERE id = $2", [payment.id, order.id]);
    return send(res, 201, { orderId: order.id, confirmationUrl });
  }

  if (path === "payments/status" && method === "GET") {
    const user = requireUser(req, res);
    if (!user) return;
    const orderId = url.searchParams.get("id");
    if (!orderId || !/^[0-9a-f-]{36}$/i.test(orderId)) return fail(res, 400, "Некорректный номер заказа");
    const result = await database.query(
      "SELECT id, status, provider_payment_id FROM orders WHERE id = $1 AND user_id = $2",
      [orderId, user.id],
    );
    if (!result.rowCount) return fail(res, 404, "Заказ не найден");
    let status = result.rows[0].status;
    if (status === "pending" && result.rows[0].provider_payment_id) {
      status = (await refreshPayment(database, result.rows[0].provider_payment_id)).status;
    }
    return send(res, 200, { orderId, status });
  }

  if (path === "payments/webhook" && method === "POST") {
    const data = await body(req);
    const paymentId = data.object?.id;
    if (typeof paymentId !== "string" || !/^[0-9a-f-]{36}$/i.test(paymentId) ||
      !["payment.succeeded", "payment.canceled"].includes(data.event)) {
      return fail(res, 400, "Некорректное событие ЮKassa");
    }
    await refreshPayment(database, paymentId);
    return send(res, 200, { ok: true });
  }

  return fail(res, 404, "Маршрут не найден");
}

export default async function handler(req, res) {
  try {
    await handle(req, res);
  } catch (error) {
    if (res.writableEnded) return;
    if (error.status) return fail(res, error.status, error.message);
    console.error("API request failed:", error);
    return fail(res, 500, "Внутренняя ошибка сервера");
  }
}
