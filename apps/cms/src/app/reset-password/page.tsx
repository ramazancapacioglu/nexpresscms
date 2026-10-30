import Link from "next/link";
import { headers } from "next/headers";
import { PASSWORD_MIN_LENGTH } from "@nexpress/core";
import { resolveAccountToken } from "@/lib/account-mail";
import { ResetForm } from "./reset-form";

export const metadata = {
  title: "Parola belirle — NexPress",
  robots: { index: false, follow: false },
  referrer: "no-referrer", // belirteç adreste: üçüncü tarafa sızmasın
};

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  const found = t ? await resolveAccountToken(siteId, t) : null;
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      {found && t ? (
        <>
          <div>
            <h1 className="text-lg font-semibold">{found.purpose === "invite" ? "Hesabınızı etkinleştirin" : "Yeni parola belirleyin"}</h1>
            <p className="text-xs text-zinc-500">{found.user.email}</p>
          </div>
          <ResetForm token={t} minLength={PASSWORD_MIN_LENGTH} />
        </>
      ) : (
        <>
          <div>
            <h1 className="text-lg font-semibold">Bağlantı geçerli değil</h1>
            <p className="text-xs text-zinc-500">Bağlantının süresi dolmuş, daha önce kullanılmış veya hatalı olabilir.</p>
          </div>
          <Link href="/forgot-password" className="text-sm underline">Yeni sıfırlama bağlantısı iste</Link>
        </>
      )}
    </main>
  );
}
