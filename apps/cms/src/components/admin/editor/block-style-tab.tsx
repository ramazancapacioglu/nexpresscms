"use client";

import { BLOCK_ANIMATIONS, type BlockAnimationName, type BlockHoverValues, type BlockStyleValues } from "@nexpress/core";
import { StylePresetBar } from "./style-preset-bar";
import { useStudioInspector } from "./studio-inspector-context";
import { ColorInput, NumberInput, SelectInput, StylePanel, TextInput } from "./style-controls";

const SHADOW_OPTIONS: Array<["none" | "sm" | "md" | "lg" | "xl" | "", string]> = [["", "—"], ["none", "Yok"], ["sm", "Hafif"], ["md", "Orta"], ["lg", "Derin"], ["xl", "Sinematik"]];
const ANIMATION_LABELS: Record<BlockAnimationName, string> = {
  "fade-in": "Belirme", "fade-up": "Alttan belirme", "fade-down": "Üstten belirme",
  "fade-left": "Sağdan belirme", "fade-right": "Soldan belirme", "zoom-in": "Yakınlaşma",
};

/** Stil sekmesi: katlanır paneller, her denetimde cihaz kuralı, "düzenlendi" noktası ve tek tıkla sıfırlama. */
export function BlockStyleTab() {
  const { styleDevice, setStyleDevice, updateSelectedBlockStyle, updateSelectedBlockStyleRoot, getActiveStyleValue, selectedBlock } = useStudioInspector();
  const g = getActiveStyleValue;
  const set = <K extends keyof BlockStyleValues>(key: K) => (v: BlockStyleValues[K] | undefined) => updateSelectedBlockStyle({ [key]: v } as Partial<BlockStyleValues>);
  const any = (...keys: Array<keyof BlockStyleValues>) => keys.some((k) => g(k) !== undefined && g(k) !== "");
  const style = selectedBlock?.style;
  const hover = style?.hover ?? {};
  const setHover = <K extends keyof BlockHoverValues>(key: K) => (v: BlockHoverValues[K] | undefined) => {
    const next = { ...hover, [key]: v };
    updateSelectedBlockStyleRoot({ hover: Object.values(next).some((x) => x !== undefined && x !== "") ? next : undefined });
  };

  return (
    <div className="space-y-2.5">
      <StylePresetBar />
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-2.5 py-1.5">
        <span className="text-[11px] font-semibold">Cihaz kuralı</span>
        <div className="inline-flex items-center gap-1">
          {(["desktop", "tablet", "mobile"] as const).map((dev) => (
            <button key={dev} type="button" aria-pressed={styleDevice === dev} onClick={() => setStyleDevice(dev)} className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${styleDevice === dev ? "bg-blue-600 text-white" : "bg-background text-[#5F6570] dark:text-[#8C9099]"}`}>
              {dev === "desktop" ? "Masaüstü" : dev === "tablet" ? "Tablet" : "Mobil"}
            </button>
          ))}
        </div>
      </div>

      <StylePanel title="Renk ve arka plan" defaultOpen edited={any("backgroundColor", "textColor", "backgroundGradient")}>
        <div className="grid grid-cols-2 gap-2">
          <ColorInput label="Arka plan rengi" value={g("backgroundColor")} onChange={set("backgroundColor")} />
          <ColorInput label="Metin rengi" value={g("textColor")} onChange={set("textColor")} fallback="#09090b" />
        </div>
        <TextInput label="Gradyan" value={g("backgroundGradient")} onChange={set("backgroundGradient")} placeholder="linear-gradient(135deg, #eff6ff, #fff)" />
        <TextInput label="Saydamlık (0–1)" value={g("opacity") === undefined ? undefined : String(g("opacity"))} onChange={(v) => updateSelectedBlockStyle({ opacity: v === undefined || Number.isNaN(Number(v)) ? undefined : Math.min(1, Math.max(0, Number(v))) })} placeholder="1" />
      </StylePanel>

      <StylePanel title={`Boşluk (${styleDevice === "desktop" ? "masaüstü" : styleDevice})`} edited={any("paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "marginTop", "marginBottom", "marginLeft", "marginRight", "gap")}>
        <div className="grid grid-cols-4 gap-1.5">
          {([["paddingTop", "Üst"], ["paddingRight", "Sağ"], ["paddingBottom", "Alt"], ["paddingLeft", "Sol"]] as const).map(([k, l]) => (
            <TextInput key={k} label={`İç ${l}`} value={g(k)} onChange={set(k)} placeholder="20px" />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {([["marginTop", "Üst"], ["marginRight", "Sağ"], ["marginBottom", "Alt"], ["marginLeft", "Sol"]] as const).map(([k, l]) => (
            <TextInput key={k} label={`Dış ${l}`} value={g(k)} onChange={set(k)} placeholder="0" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <TextInput label="Boşluk (gap)" value={g("gap")} onChange={set("gap")} placeholder="24px" />
          <TextInput label="En çok genişlik" value={g("maxWidth")} onChange={set("maxWidth")} placeholder="1200px" />
          <TextInput label="En az yükseklik" value={g("minHeight")} onChange={set("minHeight")} placeholder="320px" />
        </div>
      </StylePanel>

      <StylePanel title="Tipografi" edited={any("fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "textTransform", "textAlign", "textShadow")}>
        <TextInput label="Yazı tipi ailesi" value={g("fontFamily")} onChange={set("fontFamily")} placeholder="Inter, system-ui, sans-serif" />
        <div className="grid grid-cols-3 gap-1.5">
          <TextInput label="Boyut" value={g("fontSize")} onChange={set("fontSize")} placeholder="18px" />
          <SelectInput label="Kalınlık" value={g("fontWeight")} onChange={set("fontWeight")} options={[["", "—"], ["300", "300"], ["400", "400"], ["500", "500"], ["600", "600"], ["700", "700"], ["800", "800"], ["900", "900"]]} />
          <TextInput label="Satır yüksekliği" value={g("lineHeight")} onChange={set("lineHeight")} placeholder="1.5" />
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <TextInput label="Harf aralığı" value={g("letterSpacing")} onChange={set("letterSpacing")} placeholder="0.02em" />
          <SelectInput label="Harf düzeni" value={g("textTransform")} onChange={set("textTransform")} options={[["", "—"], ["none", "Normal"], ["uppercase", "BÜYÜK"], ["lowercase", "küçük"], ["capitalize", "Başlık"]]} />
          <SelectInput label="Hizalama" value={g("textAlign")} onChange={set("textAlign")} options={[["", "—"], ["left", "Sol"], ["center", "Orta"], ["right", "Sağ"]]} />
        </div>
        <SelectInput label="Metin gölgesi" value={g("textShadow")} onChange={set("textShadow")} options={[["", "—"], ["none", "Yok"], ["sm", "Hafif"], ["md", "Orta"], ["lg", "Derin"]]} />
      </StylePanel>

      <StylePanel title="Kenarlık ve gölge" edited={any("borderWidth", "borderColor", "borderRadius", "borderStyle", "boxShadow")}>
        <div className="grid grid-cols-3 gap-1.5">
          <TextInput label="Kalınlık" value={g("borderWidth")} onChange={set("borderWidth")} placeholder="1px" />
          <SelectInput label="Biçim" value={g("borderStyle")} onChange={set("borderStyle")} options={[["", "Düz"], ["solid", "Düz"], ["dashed", "Kesik"], ["dotted", "Noktalı"], ["double", "Çift"]]} />
          <TextInput label="Köşe (radius)" value={g("borderRadius")} onChange={set("borderRadius")} placeholder="12px" />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <ColorInput label="Kenarlık rengi" value={g("borderColor")} onChange={set("borderColor")} fallback="#e5e7eb" />
          <SelectInput label="Gölge" value={g("boxShadow")} onChange={set("boxShadow")} options={SHADOW_OPTIONS} />
        </div>
      </StylePanel>

      <StylePanel title="Arka plan görseli" edited={any("backgroundImage", "backgroundOverlay", "backgroundSize", "backgroundPosition", "backgroundFixed")}>
        <TextInput label="Görsel adresi" value={g("backgroundImage")} onChange={set("backgroundImage")} placeholder="/media/…" />
        <div className="grid grid-cols-2 gap-1.5">
          <SelectInput label="Boyut" value={g("backgroundSize")} onChange={set("backgroundSize")} options={[["", "Kapla"], ["cover", "Kapla"], ["contain", "Sığdır"], ["auto", "Otomatik"]]} />
          <TextInput label="Konum" value={g("backgroundPosition")} onChange={set("backgroundPosition")} placeholder="center" />
        </div>
        <TextInput label="Kaplama (rgba)" value={g("backgroundOverlay")} onChange={set("backgroundOverlay")} placeholder="rgba(0,0,0,.45)" />
        <label className="flex items-center gap-2 text-[11px]">
          <input type="checkbox" checked={Boolean(g("backgroundFixed"))} onChange={(e) => updateSelectedBlockStyle({ backgroundFixed: e.target.checked || undefined })} /> Sabit arka plan (paralaks etkisi)
        </label>
      </StylePanel>

      <StylePanel title="Dönüşüm" edited={any("translateY", "scale", "rotate")}>
        <div className="grid grid-cols-3 gap-1.5">
          <TextInput label="Dikey kaydır" value={g("translateY")} onChange={set("translateY")} placeholder="-4px" />
          <NumberInput label="Ölçek" value={g("scale")} onChange={set("scale")} min={0.1} max={3} step={0.05} placeholder="1" />
          <TextInput label="Döndür" value={g("rotate")} onChange={set("rotate")} placeholder="2deg" />
        </div>
      </StylePanel>

      <StylePanel title="Üzerine gelince (hover)" edited={Object.values(hover).some((v) => v !== undefined)}>
        <p className="text-[10px] text-[#5F6570] dark:text-[#8C9099]">Tüm cihazlar için geçerlidir; dokunmatik ekranlarda uygulanmaz.</p>
        <div className="grid grid-cols-2 gap-1.5">
          <ColorInput label="Arka plan" value={hover.backgroundColor} onChange={setHover("backgroundColor")} />
          <ColorInput label="Metin" value={hover.textColor} onChange={setHover("textColor")} fallback="#09090b" />
          <ColorInput label="Kenarlık" value={hover.borderColor} onChange={setHover("borderColor")} fallback="#e5e7eb" />
          <SelectInput label="Gölge" value={hover.boxShadow} onChange={setHover("boxShadow")} options={SHADOW_OPTIONS} />
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <TextInput label="Dikey kaydır" value={hover.translateY} onChange={setHover("translateY")} placeholder="-4px" />
          <NumberInput label="Ölçek" value={hover.scale} onChange={setHover("scale")} min={0.1} max={3} step={0.05} placeholder="1.03" />
          <NumberInput label="Geçiş (ms)" value={style?.transitionMs} onChange={(v) => updateSelectedBlockStyleRoot({ transitionMs: v })} min={0} max={3000} step={50} placeholder="200" />
        </div>
      </StylePanel>

      <StylePanel title="Giriş animasyonu" edited={Boolean(style?.animation)}>
        <p className="text-[10px] text-[#5F6570] dark:text-[#8C9099]">Kaydırırken görünüme girince oynar (CSS ile; JavaScript yok). Desteklemeyen tarayıcılarda blok animasyonsuz görünür.</p>
        <SelectInput label="Efekt" value={style?.animation} onChange={(v) => updateSelectedBlockStyleRoot({ animation: v })} options={[["", "Yok"], ...BLOCK_ANIMATIONS.map((a): [BlockAnimationName, string] => [a, ANIMATION_LABELS[a]])]} />
      </StylePanel>
    </div>
  );
}
