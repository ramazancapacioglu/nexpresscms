import type { NextRequest } from "next/server";
import { llmsTxtResponse } from "@/lib/llms-response";

/** `/{locale}/llms.txt`: dil başına llms.txt (etkin olmayan dil varsayılana düşer, 404 değil). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return llmsTxtResponse(request, locale);
}
