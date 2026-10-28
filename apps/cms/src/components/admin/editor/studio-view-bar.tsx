"use client";

import type { DeviceKey } from "@nexpress/core";
import { Code2, Eye, FileCode, LayoutTemplate, Monitor, Smartphone, Tablet } from "lucide-react";
import { useStudioInspector } from "./studio-inspector-context";

const MODES = [
  { id: "visual", label: "Görsel", icon: LayoutTemplate },
  { id: "preview", label: "Önizleme", icon: Eye },
  { id: "code", label: "JSON", icon: Code2 },
  { id: "markdown", label: "Markdown", icon: FileCode },
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
      <div className="inline-flex items-center rounded-md border border-border bg-muted/40 p-0.5">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          const active = editorMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => setEditorMode(mode.id)}
              className={`inline-flex h-7 items-center gap-1 rounded px-2 text-[11px] font-medium ${
                active ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3 w-3 shrink-0" />
              <span className="hidden lg:inline">{mode.label}</span>
            </button>
          );
        })}
      </div>
      <div className="inline-flex items-center rounded-md border border-border bg-background p-0.5">
        {DEVICES.map((device) => {
          const Icon = device.icon;
          return (
            <button
              key={device.id}
              type="button"
              title={device.title}
              onClick={() => {
                setViewport(device.id);
                setStyleDevice(device.id);
              }}
              className={`rounded p-1 ${
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
