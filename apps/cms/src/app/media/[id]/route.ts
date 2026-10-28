import { NextResponse, type NextRequest } from "next/server";
import { isValidMediaId, variantPath } from "@nexpress/core";

/** Kısa adres: en büyük makul WebP türevine yönlendirir (bağlantı paylaşımı için). */
export function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return params.then(({ id }) =>
    isValidMediaId(id)
      ? NextResponse.redirect(new URL(variantPath(id, 1280, "webp"), request.url), 302)
      : new NextResponse("Not found", { status: 404 })
  );
}
