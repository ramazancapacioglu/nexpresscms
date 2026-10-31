import type { NextRequest } from "next/server";
import { llmsFullResponse } from "@/lib/llms-full-response";

/** `/{locale}/llms-full.txt`: dil başına tam bilgi bankası. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return llmsFullResponse(request, locale);
}
