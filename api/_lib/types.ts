import type { IncomingMessage, ServerResponse } from "http";

export interface ApiRequest extends IncomingMessage {
  query?: Record<string, string | string[] | undefined>;
  cookies?: Record<string, string | undefined>;
  body?: unknown;
}

export interface ApiResponse extends ServerResponse {
  status: (statusCode: number) => ApiResponse;
  json: (data: unknown) => ApiResponse;
  redirect: (statusOrUrl: number | string, url?: string) => ApiResponse;
}

export interface ApiSuccessResponse<T = unknown> {
  ok: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  ok: false;
  error: string;
  code?: string;
  details?: unknown;
}

export interface AuthContext {
  adminId: string;
  username: string;
  email: string;
  sessionId: string;
}

