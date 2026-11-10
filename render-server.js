import { createServer } from "node:http";
import apiHandler from "./api/[...path].js";

function allowedOrigins() {
  return (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => new URL(origin).origin);
}

function isAllowedOrigin(origin, requestHost, origins) {
  if (!origin) return false;
  let parsedOrigin;
  try {
    parsedOrigin = new URL(origin);
  } catch {
    return false;
  }
  if (origins.length) return origins.includes(parsedOrigin.origin);
  return parsedOrigin.host === requestHost;
}

function sendError(res, status, message) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify({ error: message }));
}

const server = createServer((req, res) => {
  let url;
  try {
    url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  } catch {
    return sendError(res, 400, "Invalid request URL");
  }

  if (url.pathname !== "/api" && !url.pathname.startsWith("/api/")) {
    return sendError(res, 404, "Not found");
  }

  let origins;
  try {
    origins = allowedOrigins();
  } catch (error) {
    console.error("Invalid CORS_ORIGINS configuration:", error);
    return sendError(res, 500, "Invalid CORS_ORIGINS configuration");
  }

  const origin = req.headers.origin;
  const requestHost = req.headers["x-forwarded-host"] || req.headers.host;
  const originAllowed = isAllowedOrigin(origin, requestHost, origins);
  if (origin && !originAllowed) return sendError(res, 403, "Origin is not allowed");

  if (originAllowed) {
    res.setHeader("Access-Control-Allow-Origin", new URL(origin).origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
  }

  if (req.method === "OPTIONS") {
    if (origin && !originAllowed) return sendError(res, 403, "Origin is not allowed");
    res.writeHead(204, {
      "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "600",
    });
    return res.end();
  }

  apiHandler(req, res).catch((error) => {
    if (res.writableEnded) return;
    console.error("API request failed:", error);
    sendError(res, 500, "Internal server error");
  });
});

const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("PORT must be a valid TCP port");
}

server.listen(port, "0.0.0.0");
