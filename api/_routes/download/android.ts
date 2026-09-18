import type { ApiRequest, ApiResponse } from "../../_lib/types.js";
import { handlePlatformDownload } from "../../_lib/publicDownload.js";

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  return handlePlatformDownload(req, res, "android");
}

