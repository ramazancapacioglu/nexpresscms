import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="mx-auto mt-10 max-w-md space-y-3 text-center text-[13px]">
      <h1 className="text-[16px] font-semibold">Kayıt bulunamadı</h1>
      <p className="text-[#5F6570] dark:text-[#9CA3AF]">Aradığınız kayıt silinmiş, başka bir siteye ait ya da adres hatalı olabilir.</p>
      <Link href="/admin" className="inline-flex h-8 items-center rounded-md bg-[#266DF0] px-4 text-[12px] font-semibold text-white">Genel bakışa dön</Link>
    </div>
  );
}
