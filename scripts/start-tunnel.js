import { spawn } from "node:child_process";

if (process.env.NODE_ENV !== "development" ||
  process.env.LOCAL_DEV_ADMIN !== "true" ||
  !process.env.DATABASE_URL) {
  throw new Error("Tunnel script requires local.env with development mode, LOCAL_DEV_ADMIN=true, and DATABASE_URL");
}

const port = process.env.PORT || "3000";
const origins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
if (!origins.length) {
  throw new Error("Set CORS_ORIGINS to the exact public Layero frontend origin before starting the tunnel");
}
for (const origin of origins) {
  const parsed = new URL(origin);
  if (parsed.origin !== origin || !["https:", "http:"].includes(parsed.protocol)) {
    throw new Error(`CORS_ORIGINS must contain origins only, without paths or trailing slashes: ${origin}`);
  }
}

const childEnv = {
  ...process.env,
  PORT: port,
  LOCAL_DEV_ADMIN: "false",
  TUNNEL_MODE: "true",
};
const backend = spawn(process.execPath, ["render-server.js"], { env: childEnv, stdio: "inherit" });
const ngrokArgs = ["http", `127.0.0.1:${port}`];
if (process.env.NGROK_DOMAIN) ngrokArgs.push("--url", process.env.NGROK_DOMAIN);
const ngrok = spawn(process.env.NGROK_BIN || "ngrok", ngrokArgs, { stdio: "inherit" });

let stopping = false;
function stop(code) {
  if (stopping) return;
  stopping = true;
  if (backend.exitCode === null) backend.kill();
  if (ngrok.exitCode === null) ngrok.kill();
  process.exitCode = code;
}

backend.on("error", (error) => {
  console.error("Could not start the API server:", error.message);
  stop(1);
});
backend.on("exit", (code) => {
  if (!stopping) {
    console.error(`API server exited${code === null ? "" : ` with code ${code}`}.`);
    stop(code || 1);
  }
});
ngrok.on("error", (error) => {
  console.error("Could not start ngrok. Install the ngrok CLI, add its authtoken, then retry:", error.message);
  stop(1);
});
ngrok.on("exit", (code) => {
  if (!stopping) {
    console.error(`ngrok exited${code === null ? "" : ` with code ${code}`}.`);
    stop(code || 1);
  }
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => stop(0));
}

const deadline = Date.now() + 30_000;
let tunnelUrl;
while (!stopping && Date.now() < deadline) {
  try {
    const response = await fetch("http://127.0.0.1:4040/api/tunnels", {
      signal: AbortSignal.timeout(1_000),
    });
    if (response.ok) {
      const { tunnels = [] } = await response.json();
      tunnelUrl = tunnels.find((tunnel) => tunnel.proto === "https")?.public_url;
      if (tunnelUrl) break;
    }
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

if (!tunnelUrl) {
  console.error("Could not obtain an HTTPS ngrok URL. Check the ngrok CLI and authentication.");
  stop(1);
} else {
  console.info(`Backend tunnel: ${tunnelUrl}`);
  console.info("Set VITE_API_URL to this URL in the Layero frontend project, then redeploy the frontend.");
  console.info(`Allowed frontend origins: ${origins.join(", ")}`);
  console.info("The hardcoded local dev-admin is disabled while the tunnel is running.");
}
