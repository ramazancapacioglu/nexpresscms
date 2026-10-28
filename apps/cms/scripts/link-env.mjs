// Monorepo: ortam değişkenleri kökteki .env dosyasındadır; Next yalnızca bu klasörü okur.
// Bu betik apps/cms/.env sembolik bağını (yoksa) oluşturur. .env zaten .gitignore'dadır.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const target = path.resolve(here, "../.env");
const source = path.resolve(here, "../../../.env");

if (fs.existsSync(source) && !fs.existsSync(target)) {
  fs.symlinkSync(path.relative(path.dirname(target), source), target);
  console.log("[env] apps/cms/.env -> ../../.env bağlandı.");
}
