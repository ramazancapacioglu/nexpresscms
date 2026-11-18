import { NextResponse, type NextRequest } from "next/server";
import { isValidMediaId, MEDIA_WIDTHS, variantPath } from "@nexpress/core";

/**
 * Kısa adres: istenen genişliğe (`?w=`) en yakın türeve, yoksa en büyük makul WebP türevine yönlendirir.
 * Yönlendirme göreli yoldur: ters vekil arkasında istek adresi `localhost` olabilir ve mutlak adres görseli kırar.
 */
export function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return params.then(({ id }) => {
    if (!isValidMediaId(id)) return new NextResponse("Not found", { status: 404 });
    const wanted = Number(request.nextUrl.searchParams.get("w"));
    const width = Number.isFinite(wanted) && wanted > 0 ? (MEDIA_WIDTHS.find((step) => step >= wanted * 2) ?? 1280) : 1280;
    return new NextResponse(null, { status: 302, headers: { location: variantPath(id, width, "webp"), "cache-control": "public, max-age=86400" } });
  });
}
