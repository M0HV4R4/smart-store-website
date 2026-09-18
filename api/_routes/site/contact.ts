import { db } from "../../_lib/db.js";
import {
  requireMethod,
  setCacheHeaders,
  sendSuccess,
  handleApiError,
} from "../../_lib/response.js";
import { getPublicContactData } from "../../_lib/website.js";
import type { ApiRequest, ApiResponse } from "../../_lib/types.js";

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

