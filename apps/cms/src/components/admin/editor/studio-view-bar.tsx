"use client";

import type { DeviceKey } from "@nexpress/core";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import { useStudioInspector } from "./studio-inspector-context";

const MODES = [
  { id: "visual", label: "Görsel" },
  { id: "preview", label: "Önizleme" },
  { id: "code", label: "JSON" },
  { id: "markdown", label: "Markdown" },
] as const;

const DEVICES: Array<{ id: DeviceKey; icon: typeof Monitor; title: string }> = [
  { id: "desktop", icon: Monitor, title: "Masaüstü" },
  { id: "tablet", icon: Tablet, title: "Tablet" },
  { id: "mobile", icon: Smartphone, title: "Mobil" },
];

export function StudioViewBar() {
  const { editorMode, setEditorMode, viewport, setViewport, setStyleDevice } = useStudioInspector();

  return (
    <div className="flex min-w-0 items-center gap-2">
      <select
        aria-label="Görünüm modu"
        value={editorMode}
        onChange={(e) => setEditorMode(e.target.value as (typeof MODES)[number]["id"])}
        className="h-8 rounded-md border border-border bg-background px-2.5 text-[12px] font-medium text-foreground focus:border-blue-500 focus:outline-none"
      >
        {MODES.map((mode) => (
          <option key={mode.id} value={mode.id}>
            {mode.label}
          </option>
        ))}
      </select>
      <div className="inline-flex items-center rounded-md border border-border bg-background p-0.5">
        {DEVICES.map((device) => {
          const Icon = device.icon;
          return (
            <button
              key={device.id}
              type="button"
              title={device.title}
              aria-label={device.title}
              aria-pressed={viewport === device.id}
              onClick={() => {
                setViewport(device.id);
                setStyleDevice(device.id);
              }}
              className={`inline-flex h-6 w-6 items-center justify-center rounded ${
                viewport === device.id ? "bg-blue-600 text-white" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
