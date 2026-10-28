import type { NextRequest } from "next/server";
import { feedResponse } from "@/lib/feed-response";

export const GET = (request: NextRequest) => feedResponse(request, "atom");
