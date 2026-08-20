import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function axiosErrorHandler(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((d) => (typeof d === "string" ? d : `${d.loc?.join(".") ?? ""}: ${d.msg ?? ""}`))
        .join("; ");
    }
    if (detail && typeof detail === "object") return JSON.stringify(detail);
    if (err.code === "ERR_NETWORK")
      return "API недоступен. Убедитесь, что бэкенд запущен (python main.py) на порту 8000.";
    return `${err.message} (${err.response?.status ?? "network"})`;
  }
  return err instanceof Error ? err.message : String(err);
}

export function shortId(id: string | null | undefined): string {
  return id ? `${id.slice(0, 8)}…` : "—";
}