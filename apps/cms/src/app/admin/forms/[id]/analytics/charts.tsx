import React from "react";

const border = "border-[#E6E7EA] dark:border-[#23262E]";
export const card = `rounded-lg border ${border} bg-white p-4 dark:bg-[#15171C]`;

export function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className={card}>
      <p className="text-[11px] font-medium text-[#8C9099]">{label}</p>
      <p className="mt-1 text-[22px] font-semibold tracking-tight text-[#14151A] dark:text-[#F3F4F6]">{value}</p>
      {hint && <p className="text-[11px] text-[#8C9099]">{hint}</p>}
    </div>
  );
}

/** Sütun grafiği (sunucuda, JS'siz). Her sütunun erişilebilir adı ve başlığı vardır. */
export function Columns({ data, label, height = 96 }: { data: Array<{ label: string; count: number }>; label: string; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <figure aria-label={label}>
      <div className="flex items-end gap-[2px]" style={{ height }} role="img" aria-label={`${label}: en yüksek ${max}`}>
        {data.map((d) => (
          <div key={d.label} title={`${d.label}: ${d.count}`} className="flex-1 rounded-t-sm bg-[#266DF0]" style={{ height: `${Math.max(d.count ? 4 : 1, (d.count / max) * 100)}%`, opacity: d.count ? 1 : 0.18 }} />
        ))}
      </div>
      <figcaption className="mt-1 flex justify-between text-[10px] text-[#8C9099]"><span>{data[0]?.label}</span><span>{data.at(-1)?.label}</span></figcaption>
    </figure>
  );
}

/** Yatay çubuklar: değer → adet + yüzde. */
export function Bars({ data, total }: { data: Array<{ label: string; count: number }>; total: number }) {
  return (
    <ul className="space-y-1.5">
      {data.slice(0, 12).map((d) => (
        <li key={d.label} className="text-[12px]">
          <div className="flex justify-between gap-3"><span className="truncate">{d.label}</span><span className="shrink-0 text-[#5C5F66] dark:text-[#9CA3AF]">{d.count}{total ? ` · %${Math.round((d.count / total) * 100)}` : ""}</span></div>
          <div className="mt-0.5 h-1.5 rounded-full bg-[#F4F5F7] dark:bg-[#1C1E24]"><div className="h-full rounded-full bg-[#266DF0]" style={{ width: `${total ? (d.count / total) * 100 : 0}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}
