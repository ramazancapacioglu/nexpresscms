"use client";

import Link from "next/link";
import { useEffect } from "react";
import { reloadIfStaleChunk } from "@/components/admin/chunk-reload";

/** Yönetim sayfası hata sınırı: ham hata gösterilmez; olası nedenler ve yeniden deneme sunulur. */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[admin]", error);
    reloadIfStaleChunk(error);
  }, [error]);
  const dbHint = /column .* does not exist|relation .* does not exist|no such (column|table)|Failed query/i.test(`${error.message} ${(error as { cause?: { message?: string } }).cause?.message ?? ""}`);
  return (
    <div role="alert" className="mx-auto mt-10 max-w-lg space-y-3 rounded-lg border border-red-500/30 bg-red-500/5 p-5 text-[13px]">
      <h1 className="text-[16px] font-semibold">Bu sayfa açılamadı</h1>
      <p className="text-[#5F6570] dark:text-[#9CA3AF]">
        {dbHint ? "Veritabanı şeması kodla uyumsuz görünüyor: bekleyen göçler uygulanmamış olabilir. Depoda " : "Beklenmeyen bir hata oluştu. Yeniden deneyin; sürerse "}
        <code className="rounded bg-[#F4F5F7] px-1 py-0.5 font-mono text-[12px] dark:bg-[#1C1E24]">{dbHint ? "pnpm db:migrate" : "Sistem durumu"}</code>
        {dbHint ? " komutunu çalıştırın." : " sayfasına bakın."}
      </p>
      {error.digest && <p className="font-mono text-[11px] text-[#5F6570] dark:text-[#8C9099]">Hata kodu: {error.digest}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={reset} className="h-8 rounded-md bg-[#266DF0] px-4 text-[12px] font-semibold text-white">Yeniden dene</button>
        <Link href="/admin/system" className="inline-flex h-8 items-center rounded-md border border-[#E6E7EA] px-4 text-[12px] font-medium dark:border-[#23262E]">Sistem durumu</Link>
        <Link href="/admin" className="inline-flex h-8 items-center rounded-md px-3 text-[12px] text-[#5F6570] hover:underline dark:text-[#9CA3AF]">Genel bakış</Link>
      </div>
    </div>
  );
}
