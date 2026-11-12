#!/usr/bin/env node
/**
 * `.nxplugin` paket aracı (yazar tarafı). Kod çalıştırmaz; yalnızca klasörü zipler ve isteğe bağlı Ed25519 ile imzalar.
 *   node scripts/nxplugin.mjs keygen > yayinci-anahtari.json         # { publicKey, privateKey }  (privateKey'i gizli tutun)
 *   node scripts/nxplugin.mjs pack <klasor> [--key yayinci-anahtari.json] [-o cikti.nxplugin]
 * `--key` verilirse plugin.json'a `publisherKey` yazılır ve `plugin.sig` üretilir. Sunucuda bu açık anahtarı
 * `PLUGIN_TRUSTED_KEYS` içine yazarsanız paket "Doğrulanmış yayıncı" olarak görünür.
 */
import { createHash, webcrypto } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(new URL("../apps/cms/package.json", import.meta.url));
const { zipSync, strToU8 } = require("fflate");
const b64u = (u8) => Buffer.from(u8).toString("base64url");
const ALLOWED = /^(plugin\.json|content-types\.json|webhooks\.json|README\.md|pages\/[a-z0-9][a-z0-9-]*\.json)$/;

function checksum(files) {
  const h = createHash("sha256");
  for (const name of Object.keys(files).filter((n) => n !== "plugin.sig").sort()) {
    h.update(`${name}\0${files[name].length}\0`);
    h.update(files[name]);
  }
  return h.digest("hex");
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === "keygen") {
  const pair = await webcrypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  const publicKey = b64u(new Uint8Array(await webcrypto.subtle.exportKey("raw", pair.publicKey)));
  const privateKey = b64u(new Uint8Array(await webcrypto.subtle.exportKey("pkcs8", pair.privateKey)));
  console.log(JSON.stringify({ publicKey, privateKey }, null, 2));
} else if (cmd === "pack") {
  const dir = rest.find((a) => !a.startsWith("-") && rest[rest.indexOf(a) - 1] !== "--key" && rest[rest.indexOf(a) - 1] !== "-o");
  const keyFile = rest[rest.indexOf("--key") + 1];
  const out = rest.includes("-o") ? rest[rest.indexOf("-o") + 1] : `${path.basename(path.resolve(dir ?? "paket"))}.nxplugin`;
  if (!dir || !fs.existsSync(dir)) { console.error("Klasör bulunamadı."); process.exit(1); }
  const files = {};
  const walk = (d, prefix = "") => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const rel = `${prefix}${e.name}`;
      if (e.isDirectory()) walk(path.join(d, e.name), `${rel}/`);
      else if (ALLOWED.test(rel)) files[rel] = new Uint8Array(fs.readFileSync(path.join(d, e.name)));
      else if (rel !== "plugin.sig") console.error(`atlandı (pakete girmez): ${rel}`);
    }
  };
  walk(dir);
  if (!files["plugin.json"]) { console.error("plugin.json yok."); process.exit(1); }
  if (keyFile) {
    const { publicKey, privateKey } = JSON.parse(fs.readFileSync(keyFile, "utf8"));
    const manifest = JSON.parse(Buffer.from(files["plugin.json"]).toString("utf8"));
    manifest.publisherKey = publicKey;
    files["plugin.json"] = strToU8(JSON.stringify(manifest, null, 2));
    const key = await webcrypto.subtle.importKey("pkcs8", Buffer.from(privateKey, "base64url"), { name: "Ed25519" }, false, ["sign"]);
    const sig = new Uint8Array(await webcrypto.subtle.sign({ name: "Ed25519" }, key, new TextEncoder().encode(`nxplugin-v1:${checksum(files)}`)));
    files["plugin.sig"] = strToU8(JSON.stringify({ signature: b64u(sig) }));
  }
  fs.writeFileSync(out, zipSync(files));
  console.log(`${out} yazıldı (${Object.keys(files).length} dosya${keyFile ? ", imzalı" : ", imzasız"}).`);
} else {
  console.error("Kullanım: nxplugin.mjs keygen | pack <klasor> [--key anahtar.json] [-o cikti.nxplugin]");
  process.exit(1);
}
