const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface RequestOptions extends RequestInit {
  campaignKey?: string;
  token?: string;
  _isRetry?: boolean;
}

let isRefreshing = false;
let refreshSubscribers: ((newToken: string) => void)[] = [];

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

async function attemptSilentRefresh(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const refreshToken = localStorage.getItem("queuejump_refresh_token");

  try {
    const res = await fetch(`${API_URL}/api/v1/tenants/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ refreshToken: refreshToken || undefined }),
    });

    if (!res.ok) {
      throw new Error("Refresh failed");
    }

    const data = await res.json();
    if (data.accessToken) {
      localStorage.setItem("queuejump_token", data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem("queuejump_refresh_token", data.refreshToken);
      }
      return data.accessToken;
    }
  } catch {
    localStorage.removeItem("queuejump_token");
    localStorage.removeItem("queuejump_refresh_token");
    if (window.location.pathname.startsWith("/dashboard")) {
      window.location.href = "/login";
    }
  }

  return null;
}

export async function apiRequest<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { campaignKey, token, headers = {}, _isRetry, ...rest } = options;

  const authHeaders: Record<string, string> = {};

  if (campaignKey) {
    authHeaders["X-Campaign-Key"] = campaignKey;
  }

  const storedToken = typeof window !== "undefined" ? localStorage.getItem("queuejump_token") : null;
  const activeToken = token || storedToken;
  if (activeToken) {
    authHeaders["Authorization"] = `Bearer ${activeToken}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${endpoint}`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
        ...(headers as Record<string, string>),
      },
      ...rest,
    });
  } catch (netErr: any) {
    const customErr = new Error(
      "Unable to reach the server. Please verify your connection."
    );
    (customErr as any).code = "NETWORK_ERROR";
    (customErr as any).original = netErr;
    throw customErr;
  }

  // Seamless silent token refresh interceptor on 401 Unauthorized
  if (res.status === 401 && !_isRetry && !endpoint.includes("/login") && !endpoint.includes("/refresh")) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await attemptSilentRefresh();
      isRefreshing = false;

      if (newToken) {
        onTokenRefreshed(newToken);
        return apiRequest<T>(endpoint, {
          ...options,
          token: newToken,
          _isRetry: true,
        });
      }
    } else {
      // Wait for the active refresh to finish then retry
      return new Promise<T>((resolve, reject) => {
        refreshSubscribers.push(async (newToken: string) => {
          try {
            const data = await apiRequest<T>(endpoint, {
              ...options,
              token: newToken,
              _isRetry: true,
            });
            resolve(data);
          } catch (err) {
            reject(err);
          }
        });
      });
    }
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.error?.message || `Request failed with status ${res.status}`;
    const err = new Error(errorMsg);
    (err as any).code = data.error?.code;
    (err as any).details = data.error?.details;
    throw err;
  }

  return data as T;
}

export { API_URL, attemptSilentRefresh };