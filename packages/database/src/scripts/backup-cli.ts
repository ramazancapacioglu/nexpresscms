import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { parseWithDates, stringifyWithDates } from "@nexpress/core";
import { BackupRepository, type BackupData, type ImportMode } from "../backup-repository";
import { getDbDialect } from "../client";

export interface CliBackupPayload {
  format: "nexpress-cli-backup/v1";
  createdAt: string;
  siteId: string;
  personal: boolean;
  data: BackupData;
}

function parseArg(args: string[], prefix: string): string | undefined {
  const found = args.find((a) => a.startsWith(`${prefix}=`));
  return found ? found.slice(prefix.length + 1).trim() : undefined;
}

export async function exportTenantBackupToFile(options: {
  siteId: string;
  outPath: string;
  personal?: boolean;
}) {
  const repo = new BackupRepository(options.siteId, getDbDialect());
  const data = await repo.exportData({ personal: Boolean(options.personal) });
  const payload: CliBackupPayload = {
    format: "nexpress-cli-backup/v1",
    createdAt: new Date().toISOString(),
    siteId: options.siteId,
    personal: Boolean(options.personal),
    data,
  };
  const abs = resolve(options.outPath);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, stringifyWithDates(payload), "utf8");
  const totalRows = Object.values(data.tables).reduce((acc, rows) => acc + (rows?.length ?? 0), 0);
  return { path: abs, totalRows, tables: Object.fromEntries(Object.entries(data.tables).map(([k, v]) => [k, v?.length ?? 0])) };
}

export async function importTenantBackupFromFile(options: {
  siteId: string;
  inPath: string;
  mode?: ImportMode;
}) {
  const abs = resolve(options.inPath);
  const raw = readFileSync(abs, "utf8");
  const parsed = parseWithDates<Partial<CliBackupPayload> & { site?: unknown; tables?: unknown }>(raw);
  const data: BackupData =
    parsed.format === "nexpress-cli-backup/v1" && parsed.data
      ? parsed.data
      : parsed.tables && typeof parsed.tables === "object"
        ? ({ site: (parsed.site as BackupData["site"]) ?? null, tables: parsed.tables as BackupData["tables"] })
        : (() => {
            throw new Error("Geçersiz yedek dosyası biçimi.");
          })();
  const repo = new BackupRepository(options.siteId, getDbDialect());
  return repo.importData(data, options.mode === "replace" ? "replace" : "merge");
}

async function main() {
  const [, , cmd, ...rest] = process.argv;
  const siteId = parseArg(rest, "--site") || process.env.SITE_ID || "default";
  if (cmd === "export") {
    const day = new Date().toISOString().slice(0, 10);
    const outPath = parseArg(rest, "--out") || `./backups/nexpress-${siteId}-${day}.json`;
    const personal = rest.includes("--personal");
    const res = await exportTenantBackupToFile({ siteId, outPath, personal });
    console.log(`[db:export] Kiracı "${siteId}" yedeği yazıldı: ${res.path} (${res.totalRows} satır)`);
    return;
  }
  if (cmd === "import") {
    const inPath = parseArg(rest, "--in") || rest.find((a) => !a.startsWith("--"));
    if (!inPath) {
      console.error("Kullanım: pnpm db:import --in=./backups/dosya.json [--site=default] [--mode=merge|replace]");
      process.exit(1);
    }
    const mode = parseArg(rest, "--mode") === "replace" ? "replace" : "merge";
    const report = await importTenantBackupFromFile({ siteId, inPath, mode });
    const inserted = Object.values(report.tables).reduce((acc, t) => acc + (t?.inserted ?? 0), 0);
    console.log(`[db:import] Kiracı "${siteId}" (${report.mode}): +${inserted} satır aktarıldı.`);
    return;
  }
  console.error("Kullanım: pnpm db:export [--site=default] [--out=yol.json] [--personal] | pnpm db:import --in=yol.json [--site=default] [--mode=merge|replace]");
  process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("[backup-cli] Hata:", err);
    process.exit(1);
  });
}
