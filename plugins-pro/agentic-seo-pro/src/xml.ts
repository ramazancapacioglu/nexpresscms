/** XML metin kaçışı (eklenti içi küçük yardımcı; çekirdeğe bağımlılık eklememek için). */
export function xmlEscape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
