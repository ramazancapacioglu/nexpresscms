"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";
import type { BlockNode } from "@nexpress/core";
import { InsertPoint } from "./quick-insert";

/** Sürüklenen şey: tuvaldeki/gezgindeki bir blok (taşıma) ya da kitaplıktan yeni bir blok. */
export type DragPayload =
  | { kind: "move"; id: string }
  | { kind: "new"; block: BlockNode };

const MIME = "application/x-nexpress-block";

/**
 * Üst pencere ile tuval iframe'i arasında `dataTransfer.getData` kısıtlamalarına karşı
 * bellek içi yedek yük (aynı sekme içi sürükle-bırak için %100 güvenilir).
 */
let activeDragPayload: DragPayload | null = null;

interface DndValue {
  active: boolean;
  begin: (event: DragEvent, payload: DragPayload, image?: Element | null) => void;
  drop: (payload: DragPayload, parentId: string | null, index: number) => void;
}

const Ctx = createContext<DndValue>({
  active: false,
  begin: () => {},
  drop: () => {},
});
export const useEditorDnd = () => useContext(Ctx);

export function readPayload(event: DragEvent): DragPayload | null {
  try {
    const raw = event.dataTransfer?.getData(MIME);
    if (raw) return JSON.parse(raw) as DragPayload;
  } catch {
    // iframe sınırında yedek yükü kullan
  }
  return activeDragPayload;
}

/** Editör alanını sarar: sürükleme durumunu tutar, bırakma işlemini `onDrop`a iletir. */
export function EditorDnd({
  onDrop,
  children,
}: {
  onDrop: (payload: DragPayload, parentId: string | null, index: number) => void;
  children: ReactNode;
}) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const end = () => {
      activeDragPayload = null;
      setActive(false);
    };
    window.addEventListener("dragend", end);
    window.addEventListener("drop", end);
    return () => {
      window.removeEventListener("dragend", end);
      window.removeEventListener("drop", end);
    };
  }, []);

  const begin = useCallback<DndValue["begin"]>((event, payload, image) => {
    activeDragPayload = payload;
    try {
      event.dataTransfer.setData(MIME, JSON.stringify(payload));
      event.dataTransfer.setData("text/plain", payload.kind === "move" ? payload.id : payload.block.type);
      event.dataTransfer.effectAllowed = "copyMove";
      if (image) event.dataTransfer.setDragImage(image, 16, 12);
    } catch {
      // ignore dataTransfer errors
    }
    // Sürükleme başlar başlamaz yerleşim değişirse tarayıcı sürüklemeyi iptal eder; bir sonraki karede aç.
    requestAnimationFrame(() => setActive(true));
  }, []);

  // Bırakma bölgeleri, bırakma işleyicisi çalıştıktan sonra kapanır.
  const drop = useCallback<DndValue["drop"]>(
    (payload, parentId, index) => {
      activeDragPayload = null;
      onDrop(payload, parentId, index);
      setActive(false);
    },
    [onDrop]
  );

  const value = useMemo(() => ({ active, begin, drop }), [active, begin, drop]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** İki blok arasındaki ya da boş bir kapsayıcıdaki bırakma bölgesi. */
export function DropZone({
  parentId,
  index,
  large = false,
  label,
}: {
  parentId: string | null;
  index: number;
  large?: boolean;
  label?: string;
}) {
  const { active, drop } = useEditorDnd();
  const [over, setOver] = useState(false);

  if (!active) {
    return large ? (
      <div className="py-4 text-center text-[11px] text-muted-foreground">
        {label}
      </div>
    ) : (
      <InsertPoint
        onInsert={(block) => drop({ kind: "new", block }, parentId, index)}
      />
    );
  }

  return (
    <div
      data-nx-dropzone=""
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";
        if (!over) setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(false);
        const payload = readPayload(e);
        if (payload) drop(payload, parentId, index);
      }}
      className={`flex items-center justify-center rounded-md border-2 border-dashed text-[10px] font-semibold transition-all ${
        large ? "py-6" : over ? "h-8 my-1" : "h-5 my-0.5"
      } ${
        over
          ? "border-blue-600 bg-blue-500/20 text-blue-700 shadow-xs"
          : "border-blue-400/50 bg-blue-500/5 text-blue-600/70"
      }`}
    >
      {over ? "✓ Buraya bırak" : large ? label : "· · ·"}
    </div>
  );
}
