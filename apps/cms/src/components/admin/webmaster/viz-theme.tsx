import React from "react";

/**
 * Grafik renk ve yüzey belirteçleri (açık/koyu). Panelin koyu modu `.dark` sınıfıdır (next-themes).
 * Seriler: mavi (1), turuncu (2), turkuaz (3); durum renkleri sabit. Metin renkleri hiçbir zaman seri rengini taşımaz.
 */
const CSS = `
.nx-viz{--v-surface:#fcfcfb;--v-ink:#0b0b0b;--v-ink2:#52514e;--v-muted:#898781;--v-grid:#e1e0d9;--v-axis:#c3c2b7;--v-ring:rgba(11,11,11,.10);--v-s1:#2a78d6;--v-s2:#eb6834;--v-s3:#1baf7a;--v-good:#006300;--v-bad:#d03b3b;--v-warn:#8a5a00;--v-wash:rgba(11,11,11,.04)}
.dark .nx-viz{--v-surface:#1a1a19;--v-ink:#f0efec;--v-ink2:#c3c2b7;--v-muted:#898781;--v-grid:#2c2c2a;--v-axis:#383835;--v-ring:rgba(255,255,255,.10);--v-s1:#3987e5;--v-s2:#d95926;--v-s3:#199e70;--v-good:#0ca30c;--v-bad:#e66767;--v-warn:#fab219;--v-wash:rgba(255,255,255,.05)}
.nx-viz .v-card{background:var(--v-surface);border:1px solid var(--v-ring);border-radius:12px}
.nx-viz .v-ink{color:var(--v-ink)}.nx-viz .v-ink2{color:var(--v-ink2)}.nx-viz .v-muted{color:var(--v-muted)}
.nx-viz .v-grid{stroke:var(--v-grid);stroke-width:1}.nx-viz .v-axis{stroke:var(--v-axis);stroke-width:1}
.nx-viz .v-tick{fill:var(--v-muted);font-size:10px}
.nx-viz .v-fade{opacity:.55;transition:opacity .15s}
.nx-viz .v-bar{background:var(--v-s1);opacity:.85;border-radius:0 4px 4px 0;height:6px}
.nx-viz .v-row:hover{background:var(--v-wash)}
.nx-viz .v-tip{background:var(--v-surface);border:1px solid var(--v-ring);box-shadow:0 4px 14px rgba(0,0,0,.14);border-radius:8px;pointer-events:none}
.nx-viz table{border-collapse:collapse}
.nx-viz th{font-weight:600}
.nx-viz .v-skel{background:linear-gradient(90deg,var(--v-wash),transparent,var(--v-wash));background-size:200% 100%;animation:v-skel 1.4s linear infinite;border-radius:6px}
@keyframes v-skel{to{background-position:-200% 0}}
@media (prefers-reduced-motion:reduce){.nx-viz .v-skel{animation:none}}
`;

export function VizTheme() {
  return <style dangerouslySetInnerHTML={{ __html: CSS }} />;
}
