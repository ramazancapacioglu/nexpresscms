"use client";

import { useState } from "react";
import { buildGradient, type GradientSpec } from "@nexpress/core";
import { Field } from "./style-controls";

const input = "h-7 rounded border border-border bg-background px-1.5 text-[11px]";

/** Görsel gradyan oluşturucu: tür, açı ve 2–3 renk durağı; çıktı doğrulanmış CSS gradyanıdır. */
export function GradientBuilder({ value, onChange }: { value: string | undefined; onChange: (css: string | undefined) => void }) {
  const [spec, setSpec] = useState<GradientSpec>({ type: "linear", angle: 135, stops: [{ color: "#2563eb", pos: 0 }, { color: "#4f46e5", pos: 100 }] });
  const apply = (next: GradientSpec) => {
    setSpec(next);
    onChange(buildGradient(next) || undefined);
  };
  const setStop = (i: number, patch: Partial<GradientSpec["stops"][number]>) => apply({ ...spec, stops: spec.stops.map((s, j) => (j === i ? { ...s, ...patch } : s)) });
  return (
    <Field label="Gradyan oluşturucu" value={value} onReset={() => onChange(undefined)}>
      <div className="space-y-1.5 rounded border border-border p-2">
        <div aria-hidden className="h-6 rounded border border-border" style={{ background: buildGradient(spec) || "transparent" }} />
        <div className="grid grid-cols-2 gap-1.5">
          <select aria-label="Gradyan türü" value={spec.type} onChange={(e) => apply({ ...spec, type: e.target.value === "radial" ? "radial" : "linear" })} className={input}>
            <option value="linear">Doğrusal</option>
            <option value="radial">Dairesel</option>
          </select>
          <input aria-label="Gradyan açısı (derece)" type="number" min={0} max={360} disabled={spec.type === "radial"} value={spec.angle} onChange={(e) => apply({ ...spec, angle: Number(e.target.value) })} className={input} />
        </div>
        {spec.stops.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input aria-label={`Durak ${i + 1} rengi`} type="color" value={/^#[0-9a-f]{6}$/i.test(s.color) ? s.color : "#000000"} onChange={(e) => setStop(i, { color: e.target.value })} className="h-7 w-8 cursor-pointer rounded border border-border" />
            <input aria-label={`Durak ${i + 1} konumu (%)`} type="number" min={0} max={100} value={s.pos} onChange={(e) => setStop(i, { pos: Number(e.target.value) })} className={`${input} w-16`} />
            {spec.stops.length > 2 && <button type="button" aria-label={`Durak ${i + 1} sil`} onClick={() => apply({ ...spec, stops: spec.stops.filter((_, j) => j !== i) })} className="text-[11px] text-red-700">Sil</button>}
          </div>
        ))}
        {spec.stops.length < 3 && <button type="button" onClick={() => apply({ ...spec, stops: [...spec.stops.slice(0, -1), { color: "#ffffff", pos: 50 }, spec.stops[spec.stops.length - 1]!] })} className="text-[11px] text-blue-700 underline dark:text-blue-300">+ Renk durağı ekle</button>}
      </div>
    </Field>
  );
}
