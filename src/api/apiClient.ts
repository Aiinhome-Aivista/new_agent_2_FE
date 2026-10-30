import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

export interface ExtendedRequestConfig<D = any> extends AxiosRequestConfig<D> {
  skipDedupe?: boolean;
  skipAuthRedirect?: boolean;
  isBackgroundCheck?: boolean;
}

/**
 * Resolves the backend API base URL:
 * 1. Honors explicit VITE_API_BASE_URL from environment when defined and non-empty.
 * 2. If running locally (localhost / 127.0.0.1) without an explicit env override, prefers local backend (http://127.0.0.1:8080/api).
 * 3. Fallback to active deployed API server: http://187.127.163.17:3012/api
 */
export const getBaseURL = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (typeof envUrl === "string" && envUrl.trim() !== "") {
    return envUrl.trim().replace(/\/+$/, "");
  }

  if (typeof window !== "undefined" && window.location) {
    const { hostname, origin } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://127.0.0.1:8080/api";
    }
    if (origin && !origin.startsWith("file://") && origin !== "null") {
      return `${origin.replace(/\/+$/, "")}/api`;
    }
  }

  return "http://187.127.163.17:3012/api";
};

export const baseURL = getBaseURL();

const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30-second standard timeout for responsive UI with remote cloud DB; long AI tasks can override via config
});

// Explicit typed signature for GET requests to preserve generic parameter inference
type AxiosGetSignature = <T = any, R = AxiosResponse<T>, D = any>(
  url: string,
  config?: AxiosRequestConfig<D>
) => Promise<R>;

// In-flight GET request deduplication to prevent duplicate concurrent network calls
const inFlightGetMap = new Map<string, Promise<any>>();
const originalGet: AxiosGetSignature = <T = any, R = AxiosResponse<T>, D = any>(
  url: string,
  config?: AxiosRequestConfig<D>
): Promise<R> => apiClient.request<T, R, D>({ ...config, method: "GET", url });

/**
 * Safely serialize query parameters without throwing on circular structures or URLSearchParams.
 */
function serializeParams(params: unknown): string {
  if (!params) return "";
  if (typeof params === "string") return params;
  if (params instanceof URLSearchParams) {
    return params.toString();
  }
  if (typeof params === "object") {
    try {
      const keys = Object.keys(params as Record<string, any>).sort();
      return keys
        .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(String((params as Record<string, any>)[k]))}`)
        .join("&");
    } catch {
      return "";
    }
  }
  return String(params);
}

/**
 * Clears the in-flight deduplication cache (useful on logout, route change, or retry).
 */
export function clearInFlightCache(): void {
  inFlightGetMap.clear();
}

/**
 * Enhanced apiClient.get with in-flight deduplication and preserved Axios typing.
 */
apiClient.get = function <T = any, R = AxiosResponse<T>, D = any>(
  url: string,
  config?: ExtendedRequestConfig<D>
): Promise<R> {
  const shouldSkip = Boolean(
    config?.skipDedupe ||
    config?.headers?.["X-Skip-Dedupe"] ||
    config?.params?._no_cache ||
    config?.signal
  );

  if (shouldSkip) {
    return originalGet<T, R, D>(url, config);
  }

  let authKey = "anon";
  try {
    const token = localStorage.getItem("token");
    if (token) authKey = token.slice(-8);
  } catch {
    // Ignore localStorage access issues
  }

  const queryKey = serializeParams(config?.params);
  const cacheKey = `${authKey}:${url}${queryKey ? `?${queryKey}` : ""}`;

  if (inFlightGetMap.has(cacheKey)) {
    return inFlightGetMap.get(cacheKey) as Promise<R>;
  }

  let requestPromise: Promise<R>;
  try {
    requestPromise = originalGet<T, R, D>(url, config);
  } catch (syncError) {
    inFlightGetMap.delete(cacheKey);
    return Promise.reject(syncError);
  }

  const trackedPromise = requestPromise.finally(() => {
    inFlightGetMap.delete(cacheKey);
  });

  inFlightGetMap.set(cacheKey, trackedPromise);
  return trackedPromise;
};

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
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
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    try {
      const config = error.config as (ExtendedRequestConfig & { skipAuthRedirect?: boolean }) | undefined;
      const skipRedirect = Boolean(
        config?.skipAuthRedirect ||
        config?.headers?.["X-Skip-Auth-Redirect"]
      );

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        clearInFlightCache();
        if (!skipRedirect && typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      } else if (error.response?.status === 403) {
        const isBackgroundCheck = Boolean(
          config?.isBackgroundCheck ||
          config?.headers?.["X-Background-Check"]
        );
        if (
          !skipRedirect &&
          !isBackgroundCheck &&
          typeof window !== "undefined" &&
          window.location.pathname !== "/unauthorized"
        ) {
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
 * Safely extracts backend detail, validation message, timeout, or network error.
 */
export function extractErrorMessage(
  error: unknown,
  defaultMessage = "An unexpected error occurred."
): string {
  if (axios.isAxiosError(error)) {
    // 1. Connection aborted or timed out
    if (error.code === "ECONNABORTED" || error.message?.toLowerCase().includes("timeout")) {
      return "Request timed out. Please verify the server is responding and try again.";
    }

    // 2. Network connectivity failure
    if (error.code === "ERR_NETWORK" || (!error.response && error.request)) {
      return "Network error: Unable to connect to the ACSE server. Please check your network connection.";
    }

    // 3. Response error payloads from ACSE backend
    const data = error.response?.data as any;
    if (typeof data === "string" && data.trim()) {
      return data.trim();
    }
    if (data?.detail) {
      if (typeof data.detail === "string" && data.detail.trim()) {
        return data.detail.trim();
      }
      if (Array.isArray(data.detail) && data.detail.length > 0) {
        return data.detail
          .map((d: any) => d.msg || d.message || (typeof d === "string" ? d : JSON.stringify(d)))
          .join(", ");
      }
      if (typeof data.detail === "object") {
        return data.detail.message || JSON.stringify(data.detail);
      }
    }
    if (data?.message && typeof data.message === "string") {
      return data.message.trim();
    }
    if (data?.error && typeof data.error === "string") {
      return data.error.trim();
    }
    if (error.message) {
      return error.message;
    }
  } else if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
}

/**
 * Safe API execution wrapper with built-in try-catch for reactive components.
 */
export async function safeApiCall<T>(
  apiFn: () => Promise<T>,
  fallbackMessage = "Operation failed."
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await apiFn();
    return { data, error: null };
  } catch (err) {
    const message = extractErrorMessage(err, fallbackMessage);
    console.error("[safeApiCall] Request failed:", message, err);
    return { data: null, error: message };
  }
}

export { apiClient };
export default apiClient;
