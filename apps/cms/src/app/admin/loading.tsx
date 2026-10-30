/** Yönetim sayfaları yüklenirken iskelet: düzen kaymasını önler, ekran okuyucuya durumu bildirir. */
export default function AdminLoading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-5 animate-pulse">
      <span className="sr-only">Sayfa yükleniyor…</span>
      <div className="space-y-2 border-b border-[#E6E7EA] pb-4 dark:border-[#23262E]">
        <div className="h-5 w-48 rounded bg-[#E6E7EA] dark:bg-[#23262E]" />
        <div className="h-3 w-80 max-w-full rounded bg-[#EEF0F2] dark:bg-[#1C1E24]" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-20 rounded-lg border border-[#E6E7EA] bg-white dark:border-[#23262E] dark:bg-[#15171C]" />)}
      </div>
      <div className="space-y-2 rounded-lg border border-[#E6E7EA] bg-white p-4 dark:border-[#23262E] dark:bg-[#15171C]">
        {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-4 rounded bg-[#EEF0F2] dark:bg-[#1C1E24]" style={{ width: `${92 - i * 9}%` }} />)}
      </div>
    </div>
  );
}
