import type { NextRequest } from "next/server";
import { llmsFullResponse } from "@/lib/llms-full-response";

export const GET = (request: NextRequest) => llmsFullResponse(request);
