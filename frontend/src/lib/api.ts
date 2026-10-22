const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface RequestOptions extends RequestInit {
  campaignKey?: string;
  token?: string;
}

export async function apiRequest<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { campaignKey, token, headers = {}, ...rest } = options;

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

export { API_URL };
