import type { ApiRequest, ApiResponse } from "../_lib/types";
import { handlePlatformDownload } from "../_lib/publicDownload";

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  return handlePlatformDownload(req, res, "android");
}

