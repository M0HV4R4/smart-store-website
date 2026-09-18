import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export interface AdminUser {
  id: string;
  username: string;
  email: string;
}

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface LoginResult {
  success: boolean;
  error?: string;
  errorCode?: string;
  retryAfter?: number;
}

export interface AuthContextValue {
  status: AuthStatus;
  admin: AdminUser | null;
  login: (identifier: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  const checkSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        credentials: "same-origin",
      });

      if (!response.ok) {
        setAdmin(null);
        setStatus("unauthenticated");
        return;
      }

      const payload = await response.json();

      if (payload.ok && payload.data?.authenticated && payload.data?.admin) {
        setAdmin(payload.data.admin);
        setStatus("authenticated");
      } else {
        setAdmin(null);
        setStatus("unauthenticated");
      }
    } catch (err) {
      console.error("Session verification network error:", err);
      // Fail closed: treat network failure as unauthenticated
      setAdmin(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = useCallback(
    async (identifier: string, password: string): Promise<LoginResult> => {
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          credentials: "same-origin",
          body: JSON.stringify({ identifier, password }),
        });

        const data = await response.json().catch(() => null);

        if (response.ok && data?.ok && data?.data?.admin) {
          setAdmin(data.data.admin);
          setStatus("authenticated");
          return { success: true };
        }

        // Handle 429 Too Many Requests
        if (response.status === 429) {
          const retryAfterHeader = response.headers.get("Retry-After");
          const retryAfter = retryAfterHeader
            ? parseInt(retryAfterHeader, 10)
            : data?.details?.retryAfterSeconds || 60;

          return {
            success: false,
            error: data?.error || "RATE_LIMIT",
            errorCode: "TOO_MANY_ATTEMPTS",
            retryAfter,
          };
        }

        // Handle 401 Invalid Credentials
        if (response.status === 401) {
          return {
            success: false,
            error: data?.error || "INVALID_CREDENTIALS",
            errorCode: data?.code || "INVALID_CREDENTIALS",
          };
        }

        // Handle 404 Route Not Found
        if (response.status === 404) {
          return {
            success: false,
            error: data?.error || "Route not found",
            errorCode: data?.code || "NOT_FOUND",
          };
        }

        // Handle 403 CSRF / Forbidden
        if (response.status === 403) {
          return {
            success: false,
            error: data?.error || "Forbidden",
            errorCode: data?.code || "CSRF_ERROR",
          };
        }

        // Handle 500 / 503 / other server errors
        return {
          success: false,
          error: data?.error || "Server error",
          errorCode: data?.code || "SERVER_ERROR",
        };
      } catch (err) {
        console.error("Login network error:", err);
        return {
          success: false,
          error: "NETWORK_ERROR",
          errorCode: "NETWORK_ERROR",
        };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        credentials: "same-origin",
      });
    } catch (err) {
      console.error("Logout request error:", err);
    } finally {
      // Invalidate frontend state regardless of network response
      setAdmin(null);
      setStatus("unauthenticated");
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        status,
        admin,
        login,
        logout,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
}

