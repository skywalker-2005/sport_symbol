export const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(
  /\/+$/,
  "",
);

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}/api/${path}`, {
    ...options,
    headers: {
      "ngrok-skip-browser-warning": "true",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    credentials: "include",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Не удалось выполнить запрос");
    error.status = response.status;
    error.data = data;
    throw error;
  }
  return data;
}
