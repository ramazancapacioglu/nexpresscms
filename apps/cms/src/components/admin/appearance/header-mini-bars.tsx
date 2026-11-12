import {
  DEFAULT_HEADER_ZONES,
  HEADER_WIDGET_META,
  resolveHeaderZones,
  resolveMobileHeaderZones,
  type HeaderConfig,
  type HeaderWidgetId,
  type HeaderZones,
} from "@nexpress/core";

const LABEL = Object.fromEntries(Object.entries(HEADER_WIDGET_META).map(([id, meta]) => [id, meta.label])) as Record<HeaderWidgetId, string>;

function chips(zones: HeaderZones) {
  return (["left", "center", "right"] as const).flatMap((side) =>
    zones[side].map((id) => ({ id, side, label: LABEL[id] }))
  );
}

function Bar({ zones, narrow }: { zones: HeaderZones; narrow?: boolean }) {
  const items = chips(zones);
  return (
    <div className={`flex items-center gap-1 rounded bg-white px-1.5 py-1 ${narrow ? "" : "justify-between"}`}>
      {items.length === 0 ? <span className="text-[9px] text-[#8C9099]">Boş</span> : null}
      {items.map((item) => (
        <span
          key={`${item.side}-${item.id}`}
          className={`truncate rounded px-1 py-0.5 text-[9px] font-semibold ${
            item.id === "logo" ? "bg-slate-800 text-white" : item.id === "cta" ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"
          }`}
        >
          {item.label}
        </span>
      ))}
    </div>
  );
}

/** Kütüphane kartı ve düzenleme adımı için masaüstü / mobil şerit özeti. */
export function HeaderMiniBars({ header }: { header: HeaderConfig }) {
  const top = header.topBar.enabled ? resolveHeaderZones(header.topBar, DEFAULT_HEADER_ZONES.top) : null;
  const main = resolveHeaderZones(header.mainBar, DEFAULT_HEADER_ZONES.main);
  const bottom = header.bottomBar.enabled ? resolveHeaderZones(header.bottomBar, DEFAULT_HEADER_ZONES.bottom) : null;
  const topMobile = header.topBar.enabled ? resolveMobileHeaderZones(header.topBar, top ?? DEFAULT_HEADER_ZONES.top) : null;
  const mainMobile = resolveMobileHeaderZones(header.mainBar, main);
  const bottomMobile = header.bottomBar.enabled ? resolveMobileHeaderZones(header.bottomBar, bottom ?? DEFAULT_HEADER_ZONES.bottom) : null;

  return (
    <div className="grid grid-cols-[1fr_92px] gap-2">
      <div className="space-y-1 rounded-md bg-slate-100 p-1.5">
        <div className="text-[9px] font-semibold uppercase tracking-wide text-[#5F6570]">Masaüstü</div>
        {top ? <Bar zones={top} /> : null}
        <Bar zones={main} />
        {bottom ? <Bar zones={bottom} /> : null}
      </div>
      <div className="space-y-1 rounded-md border border-slate-300 bg-slate-100 p-1.5">
        <div className="text-[9px] font-semibold uppercase tracking-wide text-[#5F6570]">Mobil</div>
        {topMobile ? <Bar zones={topMobile} narrow /> : null}
        <Bar zones={mainMobile} narrow />
        {bottomMobile ? <Bar zones={bottomMobile} narrow /> : null}
      </div>
    </div>
  );
}
