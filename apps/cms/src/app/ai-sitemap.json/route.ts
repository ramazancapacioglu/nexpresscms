import type { NextRequest } from "next/server";
import { aiSitemapResponse } from "@/lib/ai-sitemap-response";

export const GET = (request: NextRequest) => aiSitemapResponse(request);
