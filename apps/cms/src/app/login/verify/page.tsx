import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { pendingMfaUser } from "@/lib/auth/mfa";
import { VerifyForm } from "./verify-form";

export const metadata = { title: "İki adımlı doğrulama — NexPress", robots: { index: false, follow: false } };

export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const siteId = (await headers()).get("x-nexpress-site-id") ?? "default";
  if (!(await pendingMfaUser(siteId))) redirect("/login");
  const { next } = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-lg font-semibold">İki adımlı doğrulama</h1>
        <p className="text-xs text-zinc-500">Parolanız doğru. Girişi tamamlamak için kodu girin.</p>
      </div>
      <VerifyForm next={next ?? "/admin"} />
    </main>
  );
}
