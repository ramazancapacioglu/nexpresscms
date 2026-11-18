import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { resolveUploadPath } from "../src/lib/wp-uploads";

const base = path.resolve("/srv/uploads");

test("belge yolu diskteki güvenli dosyaya çözülür", () => {
  const out = resolveUploadPath(base, ["2025", "11", "wolvoxkurulum.pdf"]);
  assert.equal(out?.file, path.join(base, "2025", "11", "wolvoxkurulum.pdf"));
  assert.equal(out?.ext, "pdf");
  assert.equal(resolveUploadPath(base, ["2026", "06", "E-fatura%20indir.zip"])?.name, "E-fatura indir.zip");
});

test("yol gezinmesi, gizli dosya ve izinsiz uzantı reddedilir", () => {
  assert.equal(resolveUploadPath(base, ["..", "etc", "passwd.pdf"]), null);
  assert.equal(resolveUploadPath(base, ["%2e%2e", "x.pdf"]), null);
  assert.equal(resolveUploadPath(base, [".htaccess"]), null);
  assert.equal(resolveUploadPath(base, ["2025", "x.php"]), null);
  assert.equal(resolveUploadPath(base, ["2025", "x.svg"]), null);
  assert.equal(resolveUploadPath(base, ["a", "b", "c", "d", "e", "f", "g.pdf"]), null);
  assert.equal(resolveUploadPath(base, []), null);
});
