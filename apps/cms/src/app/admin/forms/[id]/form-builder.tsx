"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { BarChart3, Inbox, Save } from "lucide-react";
import { DEFAULT_FORM_APPEARANCE, type FormField, type FormFieldType, type FormNotifySettings, type FormSpec } from "@nexpress/core";
import type { FormDefinitionStatus } from "@nexpress/database";
import { saveFormAction } from "../actions";
import { Canvas } from "./builder-canvas";
import { FieldInspector } from "./builder-inspector";
import { createField, kindOf, newId, slugName } from "./builder-model";
import { Palette } from "./builder-palette";
import { DesignTab, EmbedTab, NotifyTab, SettingsTab } from "./builder-settings";

const border = "border-[#E6E7EA] dark:border-[#23262E]";
type Tab = "fields" | "design" | "settings" | "notify" | "embed";
const TABS: Array<[Tab, string]> = [["fields", "Alanlar"], ["design", "Görünüm"], ["settings", "Ayarlar"], ["notify", "Bildirim"], ["embed", "Yerleştirme"]];

interface Props {
  id: string;
  initial: { name: string; status: FormDefinitionStatus; spec: FormSpec; notify: FormNotifySettings };
  smtpReady: boolean;
  contactEmail: string;
  isAdmin: boolean;
}

export function FormBuilder({ id, initial, smtpReady, contactEmail, isAdmin }: Props) {
  const [name, setName] = useState(initial.name);
  const [status, setStatus] = useState(initial.status);
  const [spec, setSpec] = useState(initial.spec);
  const [notify, setNotify] = useState(initial.notify);
  const [selectedId, setSelectedId] = useState<string | null>(initial.spec.fields[0]?.id ?? null);
  const [tab, setTab] = useState<Tab>("fields");
  const [activeDrag, setActiveDrag] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const saved = useRef(JSON.stringify({ name: initial.name, status: initial.status, spec: initial.spec, notify: initial.notify }));
  const snapshot = JSON.stringify({ name, status, spec, notify });
  const dirty = snapshot !== saved.current;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const fields = spec.fields;
  const selected = useMemo(() => fields.find((f) => f.id === selectedId) ?? null, [fields, selectedId]);
  const setFields = (next: FormField[]) => setSpec((s) => ({ ...s, fields: next }));

  const insert = useCallback((type: FormFieldType, at: number) => {
    setSpec((s) => {
      if (s.fields.length >= 60) { setMsg({ ok: false, text: "En çok 60 alan eklenebilir." }); return s; }
      const f = createField(type, s.fields);
      setSelectedId(f.id);
      const next = [...s.fields];
      next.splice(at < 0 ? next.length : at, 0, f);
      return { ...s, fields: next };
    });
  }, []);

  const patchField = (patch: Partial<FormField>) => setFields(fields.map((f) => (f.id === selectedId ? { ...f, ...patch } : f)));
  const remove = (fid: string) => {
    const i = fields.findIndex((f) => f.id === fid);
    setFields(fields.filter((f) => f.id !== fid));
    if (selectedId === fid) setSelectedId(fields[i + 1]?.id ?? fields[i - 1]?.id ?? null);
  };
  const duplicate = (fid: string) => {
    const i = fields.findIndex((f) => f.id === fid);
    const src = fields[i];
    if (!src || fields.length >= 60) return;
    const copy = { ...src, id: newId(), name: slugName(src.label, new Set(fields.map((f) => f.name))), options: [...src.options] };
    setFields([...fields.slice(0, i + 1), copy, ...fields.slice(i + 1)]);
    setSelectedId(copy.id);
  };

  const onDragEnd = (e: DragEndEvent) => {
    setActiveDrag(null);
    const aid = String(e.active.id);
    const over = e.over ? String(e.over.id) : null;
    if (aid.startsWith("palette:")) {
      if (!over) return;
      insert(aid.slice(8) as FormFieldType, over === "canvas-end" ? -1 : fields.findIndex((f) => f.id === over));
    } else if (over && over !== aid && over !== "canvas-end") {
      const from = fields.findIndex((f) => f.id === aid);
      const to = fields.findIndex((f) => f.id === over);
      if (from >= 0 && to >= 0) setFields(arrayMove(fields, from, to));
    } else if (over === "canvas-end") {
      const from = fields.findIndex((f) => f.id === aid);
      if (from >= 0) setFields(arrayMove(fields, from, fields.length - 1));
    }
  };

  const save = useCallback(() => {
    setMsg(null);
    start(async () => {
      const r = await saveFormAction({ id, name, status, spec, notify });
      if (r.ok) {
        saved.current = JSON.stringify({ name, status, spec, notify });
        setMsg({ ok: true, text: "Kaydedildi." });
      } else setMsg({ ok: false, text: r.error });
    });
  }, [id, name, status, spec, notify]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(); } };
    const onUnload = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onUnload);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("beforeunload", onUnload); };
  }, [save, dirty]);

  const dragLabel = activeDrag?.startsWith("palette:") ? kindOf(activeDrag.slice(8) as FormFieldType).label : fields.find((f) => f.id === activeDrag)?.label;

  return (
    <div className="space-y-4">
      <div className={`flex flex-wrap items-center justify-between gap-3 border-b ${border} pb-3`}>
        <div className="min-w-0">
          <Link href="/admin/forms" className="text-[11px] text-[#5F6570] dark:text-[#8C9099] hover:underline">← Formlar</Link>
          <h1 className="truncate text-[18px] font-semibold tracking-tight text-[#14151A] dark:text-[#F3F4F6]">{name || "Adsız form"}</h1>
        </div>
        <div className="flex items-center gap-2 text-[12px]">
          {msg && <span role="status" className={msg.ok ? "text-emerald-800 dark:text-emerald-400" : "text-red-600"}>{msg.text}</span>}
          {dirty && !msg && <span className="text-[#5F6570] dark:text-[#8C9099]">Kaydedilmedi</span>}
          <Link href={`/admin/forms/${id}/analytics`} className={`inline-flex h-8 items-center gap-1.5 rounded-md border ${border} px-3 font-medium hover:bg-[#F4F5F7] dark:hover:bg-[#1C1E24]`}><BarChart3 className="h-3.5 w-3.5" /> Analiz</Link>
          <Link href={`/admin/forms/inbox?form=${id}`} className={`inline-flex h-8 items-center gap-1.5 rounded-md border ${border} px-3 font-medium hover:bg-[#F4F5F7] dark:hover:bg-[#1C1E24]`}><Inbox className="h-3.5 w-3.5" /> Gönderimler</Link>
          <button type="button" onClick={save} disabled={pending || !dirty} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#266DF0] px-4 font-semibold text-white disabled:opacity-50"><Save className="h-3.5 w-3.5" /> {pending ? "Kaydediliyor…" : "Kaydet"}</button>
        </div>
      </div>

      <div role="tablist" className="inline-flex rounded-md bg-[#F4F5F7] p-0.5 text-[12px] font-medium dark:bg-[#1C1E24]">
        {TABS.map(([t, label]) => (
          <button key={t} role="tab" type="button" aria-selected={tab === t} onClick={() => setTab(t)} className={`rounded px-3 py-1 ${tab === t ? "bg-white text-[#14151A] shadow-sm dark:bg-[#2A2D35] dark:text-[#F3F4F6]" : "text-[#5C5F66] dark:text-[#9CA3AF]"}`}>{label}</button>
        ))}
      </div>

      {tab === "fields" && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={(e: DragStartEvent) => setActiveDrag(String(e.active.id))} onDragCancel={() => setActiveDrag(null)} onDragEnd={onDragEnd}>
          <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)_280px]">
            <aside aria-label="Alan paleti" className="order-2 lg:order-1"><Palette onAdd={(t) => insert(t, -1)} /></aside>
            <div className="order-1 min-w-0 lg:order-2"><Canvas fields={fields} appearance={spec.appearance ?? DEFAULT_FORM_APPEARANCE} selectedId={selectedId} onSelect={setSelectedId} onRemove={remove} onDuplicate={duplicate} submitLabel={spec.submitLabel} dragging={activeDrag !== null} /></div>
            <aside aria-label="Alan özellikleri" className={`order-3 h-fit rounded-lg border ${border} bg-white p-3 dark:bg-[#15171C]`}>
              {selected ? <FieldInspector f={selected} all={fields} stepped={spec.appearance?.stepped === true} onChange={patchField} /> : <p className="py-6 text-center text-[12px] text-[#5F6570] dark:text-[#8C9099]">Düzenlemek için kanvastan bir alan seçin.</p>}
            </aside>
          </div>
          <DragOverlay>{dragLabel ? <div className="rounded-md border border-[#266DF0] bg-white px-3 py-1.5 text-[12px] shadow-lg dark:bg-[#15171C]">{dragLabel}</div> : null}</DragOverlay>
        </DndContext>
      )}
      {tab === "design" && <DesignTab spec={spec} patchSpec={(p) => setSpec((s) => ({ ...s, ...p }))} />}
      {tab === "settings" && <SettingsTab name={name} setName={setName} status={status} setStatus={setStatus} spec={spec} patchSpec={(p) => setSpec((s) => ({ ...s, ...p }))} />}
      {tab === "notify" && <NotifyTab notify={notify} patch={(p) => setNotify((n) => ({ ...n, ...p }))} fields={fields} smtpReady={smtpReady} contactEmail={contactEmail} isAdmin={isAdmin} />}
      {tab === "embed" && <EmbedTab id={id} />}
    </div>
  );
}
