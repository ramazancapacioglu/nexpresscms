"use client";

/** Erişilebilir anahtar (role=switch). Devre dışıyken tıklanmaz ve soluk görünür. */
export function PluginSwitch({
  checked,
  onChange,
  disabled,
  label,
  busy,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled || busy}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#266DF0] disabled:cursor-not-allowed disabled:opacity-40 ${
        checked ? "border-[#266DF0] bg-[#266DF0]" : "border-[#D5D8DE] dark:border-[#2E323B] bg-[#E6E7EA] dark:bg-[#23262E]"
      } ${busy ? "animate-pulse" : ""}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[18px]" : "translate-x-[3px]"}`}
      />
    </button>
  );
}
