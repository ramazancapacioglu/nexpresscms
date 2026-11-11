import { NextResponse } from "next/server";
import { iconHeaders, renderSiteIcon } from "@/lib/site-icon";

/** Tarayıcı sekmesi simgesi (32 px PNG). Site simgesi ayarlı değilse 404. */
export async function GET(request: Request) {
  const data = await renderSiteIcon(request.headers.get("x-nexpress-site-id") ?? "default", 32);
  return data ? new NextResponse(new Uint8Array(data), { headers: iconHeaders }) : new NextResponse(null, { status: 404 });
}
