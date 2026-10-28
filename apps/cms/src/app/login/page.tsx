import { LoginForm } from "./login-form";

export const metadata = { title: "Giriş — NexPress", robots: { index: false, follow: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-lg font-semibold">NexPress Yönetim</h1>
        <p className="text-xs text-zinc-500">Devam etmek için giriş yapın.</p>
      </div>
      <LoginForm next={next ?? "/admin"} />
    </main>
  );
}
