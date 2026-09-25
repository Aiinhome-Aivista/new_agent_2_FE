import axios, { AxiosError } from "axios";

export const baseURL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://187.127.163.17:3012/api" ||
  "http://127.0.0.1:8080/api";

const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 45000, // 45-second timeout for long AI agent operations
});

apiClient.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn("[ApiClient] Unable to read auth token from localStorage", e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    try {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      }
      if (error.response?.status === 403) {
        if (window.location.pathname !== "/unauthorized") {
          window.location.href = "/unauthorized";
        }
      }
    } catch (e) {
      console.error("[ApiClient] Error handling response status", e);
    }
    return Promise.reject(error);
  }
);

/**
 * Universal error message extractor for frontend try/catch blocks.
 * Safely extracts backend detail, validation message, or network error.
 */
export function extractErrorMessage(error: unknown, defaultMessage = "An unexpected error occurred."): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as any;
    if (typeof data === "string" && data.trim()) return data;
    if (data?.detail) {
      if (typeof data.detail === "string") return data.detail;
      if (Array.isArray(data.detail) && data.detail.length > 0) {
        return data.detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ");
      }
    }
    if (data?.message) return String(data.message);
    if (error.message) return error.message;
  } else if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
}

/**
 * Safe API execution wrapper with built-in try-catch for reactive components.
 */
export async function safeApiCall<T>(
  apiFn: () => Promise<T>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await apiFn();
    return { data, error: null };
  } catch (err) {
    const message = extractErrorMessage(err);
    console.error("[safeApiCall] Request failed:", message, err);
    return { data: null, error: message };
  }
}

export default apiClient;
