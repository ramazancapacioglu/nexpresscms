#!/usr/bin/env node
/**
 * NexPress CMS — Production Process Starter
 * PM2, systemd ve cPanel / Plesk Node.js Selector için ortak başlatıcı.
 */
const { spawn } = require("node:child_process");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const port = process.env.PORT || "3000";

console.log(`[NexPress] Üretim sunucusu başlatılıyor... (Port: ${port})`);

const child = spawn("pnpm", ["--filter", "@nexpress/cms", "start", "-p", String(port)], {
  cwd: rootDir,
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: "production",
    PORT: String(port),
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});

for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(sig, () => {
    try {
      child.kill(sig);
    } catch {}
  });
}
