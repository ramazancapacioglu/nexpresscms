"use client";

import React from "react";
import { BlockInspector } from "@/components/admin/editor/block-inspector";
import type { DualModeEditorState } from "./use-dual-mode-editor";

/** 3. SAĞ DENETÇİ */
export function DualModeEditorRightPanel({ s }: { s: DualModeEditorState }) {
  if (!s.rightSidebarOpen) return null;
  return <BlockInspector />;
}
