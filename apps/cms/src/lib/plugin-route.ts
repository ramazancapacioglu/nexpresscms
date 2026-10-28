import "server-only";
import type { NextRequest } from "next/server";
import { pluginRoutes } from "@nexpress/core";
import "@/plugins/register";

/** Çekirdeğin sabit uç noktası: eklenti işleyici bağladıysa onu çalıştırır, yoksa 404. */
export const pluginRouteHandler = (key: string) => (request: NextRequest) =>
  pluginRoutes.dispatch(key, { siteId: request.headers.get("x-nexpress-site-id") ?? "default", request });
