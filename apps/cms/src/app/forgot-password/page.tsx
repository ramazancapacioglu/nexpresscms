import Link from "next/link";
import { ForgotForm } from "./forgot-form";

export const metadata = { title: "Parolamı unuttum — NexPress", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-lg font-semibold">Parolamı unuttum</h1>
        <p className="text-xs text-zinc-500">Hesabınızın e-postasını girin; sıfırlama bağlantısı gönderelim.</p>
      </div>
      <ForgotForm />
      <Link href="/login" className="text-xs underline">Girişe dön</Link>
    </main>
  );
}
