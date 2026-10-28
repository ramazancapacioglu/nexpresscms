import "server-only";
import { cookies } from "next/headers";
import { signSessionToken } from "@nexpress/core/session";
import type { UserSummaryDto } from "@nexpress/database";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, getAuthSecret } from "./config";

/** Oturum çerezini kullanıcının güncel rolü ve oturum sürümüyle yazar (giriş ve parola değişimi). */
export async function issueSession(user: Pick<UserSummaryDto, "id" | "siteId" | "role" | "sessionVersion">): Promise<void> {
  const token = await signSessionToken(
    {
      sub: user.id,
      siteId: user.siteId,
      role: user.role,
      sv: user.sessionVersion,
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    },
    getAuthSecret()
  );
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}
