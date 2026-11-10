import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import apiHandler from "./api/[...path].js";

const root = fileURLToPath(new URL(".", import.meta.url));
const staticRoot = resolve(root, "dist");
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function respondError(res, status, message) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
  res.end(message);
}

async function serveStatic(req, res, pathname) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return respondError(res, 405, "Method not allowed");
  }

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return respondError(res, 400, "Invalid URL path");
  }

  const filePath = resolve(staticRoot, `.${decodedPath}`);
  const relativePath = relative(staticRoot, filePath);
  if (relativePath === ".." || relativePath.startsWith(`..${sep}`) || relativePath.startsWith(sep)) {
    return respondError(res, 403, "Forbidden");
  }

  let targetPath = filePath;
  try {
    const fileInfo = await stat(targetPath);
    if (fileInfo.isDirectory()) targetPath = resolve(targetPath, "index.html");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    if (extname(decodedPath)) return respondError(res, 404, "Not found");
    targetPath = resolve(staticRoot, "index.html");
  }

  let content;
  try {
    content = await readFile(targetPath);
  } catch (error) {
    if (error.code === "ENOENT") return respondError(res, 404, "Not found");
    throw error;
  }

  const isAsset = relative(staticRoot, targetPath).startsWith(`assets${sep}`);
  res.writeHead(200, {
    "Content-Type": mimeTypes[extname(targetPath)] || "application/octet-stream",
    "Cache-Control": isAsset ? "public, max-age=31536000, immutable" : "no-cache",
    "Content-Length": content.length,
  });
  res.end(req.method === "HEAD" ? undefined : content);
}

const server = createServer((req, res) => {
  let url;
  try {
    url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  } catch {
    return respondError(res, 400, "Invalid request URL");
  }

  if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
    apiHandler(req, res).catch((error) => {
      if (res.writableEnded) return;
      console.error("API request failed:", error);
      respondError(res, 500, "Internal server error");
    });
    return;
  }

  serveStatic(req, res, url.pathname).catch((error) => {
    if (res.writableEnded) return;
    console.error("Static request failed:", error);
    respondError(res, 500, "Internal server error");
  });
});

const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("PORT must be a valid TCP port");
}

const isLocalDevelopment = process.env.NODE_ENV === "development" && process.env.LOCAL_DEV_ADMIN === "true";
if (process.env.LOCAL_DEV_ADMIN === "true" && !isLocalDevelopment) {
  throw new Error("LOCAL_DEV_ADMIN is only available in development");
}

const host = isLocalDevelopment ? "127.0.0.1" : "0.0.0.0";
server.listen(port, host, () => {
  console.info(`Символ Спорта: http://${host}:${port}`);
  if (isLocalDevelopment) console.info("Локальный dev-администратор включён; production-доступ отключён.");
});
