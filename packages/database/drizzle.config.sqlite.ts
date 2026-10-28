import { defineConfig } from "drizzle-kit";

// `pnpm db:generate` bu şemadan SQL göçü üretir. Üretilen dosyalar migrations/sqlite altındadır ve commit edilir.
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/schema/sqlite.ts",
  out: "./migrations/sqlite",
});
