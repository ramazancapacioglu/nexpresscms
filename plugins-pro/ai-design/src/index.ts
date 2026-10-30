import { pluginRegistry } from "@nexpress/core";
import { AI_DESIGN_MANIFEST } from "./manifest";
import { registerAiDesign } from "./register";

export { generateDesign, validateThemeOutput, type GeneratedDesign, type ThemeOutput } from "./generate";
export { AI_DESIGN_MANIFEST, AI_DESIGN_PLUGIN_ID } from "./manifest";

let registered = false;

/** Kompozisyon kökü (`apps/cms/src/plugins/register.ts`) çağırır; idempotenttir. */
export function registerAiDesignProPlugin(): void {
  if (registered) return;
  registered = true;
  pluginRegistry.register(AI_DESIGN_MANIFEST);
  registerAiDesign();
}
