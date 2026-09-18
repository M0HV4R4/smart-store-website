import * as dotenv from "dotenv";

// Load local .env if available
dotenv.config();

export interface ServerEnv {
  DATABASE_URL: string;
  SESSION_SECRET: string;
  NODE_ENV: "development" | "production" | "test";
}

let cachedEnv: ServerEnv | null = null;

export function getEnv(): ServerEnv {
  if (cachedEnv) return cachedEnv;

  const DATABASE_URL = process.env.DATABASE_URL || "";
  const SESSION_SECRET = process.env.SESSION_SECRET || "";
  const NODE_ENV = (process.env.NODE_ENV as ServerEnv["NODE_ENV"]) || "development";

  if (!DATABASE_URL) {
    throw new Error(
      "SERVER CONFIGURATION ERROR: 'DATABASE_URL' is missing. Configure it in .env or Vercel Environment Variables.",
    );
  }

  if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
    if (NODE_ENV === "production") {
      throw new Error(
        "SECURITY ERROR: 'SESSION_SECRET' must be a strong cryptographically random string of at least 32 characters.",
      );
    } else {
      console.warn(
        "⚠️ WARNING: 'SESSION_SECRET' is short or unset in development. Using a fallback for local testing.",
      );
    }
  }

  cachedEnv = {
    DATABASE_URL,
    SESSION_SECRET: SESSION_SECRET || "development_session_secret_change_in_production_32chars!",
    NODE_ENV,
  };

  return cachedEnv;
}

