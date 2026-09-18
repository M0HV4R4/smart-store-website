import { db } from "../_lib/db";
import {
  requireMethod,
  setCacheHeaders,
  sendSuccess,
  handleApiError,
} from "../_lib/response";
import { getPublicContactData } from "../_lib/website";
import type { ApiRequest, ApiResponse } from "../_lib/types";

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  // 1. Safe short-lived public caching (60s) with fast revalidation
  setCacheHeaders(res, "public-cached", 60);

  // 2. Enforce GET
  if (!requireMethod(req, res, ["GET"])) return;

  try {
    const contactData = await getPublicContactData(db);
    sendSuccess(res, contactData);
  } catch (error) {
    handleApiError(res, error, "Failed to load contact information");
  }
}

