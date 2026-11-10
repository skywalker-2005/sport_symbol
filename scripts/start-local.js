import { build } from "vite";

process.env.VITE_API_URL = "";
await build();
await import("../server.js");
