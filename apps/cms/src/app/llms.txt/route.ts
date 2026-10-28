import type { NextRequest } from "next/server";
import { llmsTxtResponse } from "@/lib/llms-response";

export const GET = (request: NextRequest) => llmsTxtResponse(request);
