#!/usr/bin/env node
/**
 * Bascule le datasource Prisma entre SQLite (dev) et PostgreSQL (prod).
 *
 * Usage :
 *   node scripts/db-switch.mjs dev    # → provider sqlite
 *   node scripts/db-switch.mjs prod   # → provider postgresql + directUrl
 *   node scripts/db-switch.mjs status # → affiche le mode actuel
 *
 * Idempotent : aucun changement si déjà dans le bon mode.
 * Lance ensuite `prisma generate` automatiquement (tolérant aux locks Windows).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = join(__dirname, "..", "prisma", "schema.prisma");

const DEV_BLOCK = `datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}`;

const PROD_BLOCK = `datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}`;

const DATASOURCE_PATTERN = /datasource\s+db\s*\{[\s\S]*?\n\}/;

function readSchema() {
  return readFileSync(SCHEMA_PATH, "utf8");
}

function detectProvider(content) {
  const m = content.match(/datasource\s+db\s*\{[\s\S]*?provider\s*=\s*"([^"]+)"/);
  return m?.[1] ?? "unknown";
}

function regenerateClient() {
  console.log("🔄 prisma generate...");
  try {
    execSync("npx prisma generate", { stdio: "inherit" });
    console.log("✅ Client Prisma régénéré.");
  } catch {
    console.warn(
      "⚠️  prisma generate a échoué (probablement un processus Node qui tient le query engine .dll).",
    );
    console.warn(
      "   → Ferme tout dev server / IDE ouvrant le projet, puis relance : npx prisma generate",
    );
  }
}

const mode = process.argv[2];

if (mode === "status") {
  const provider = detectProvider(readSchema());
  console.log(`📊 Datasource Prisma actuel : ${provider}`);
  console.log(provider === "sqlite" ? "   → mode DEV" : provider === "postgresql" ? "   → mode PROD" : "   → mode inconnu");
  process.exit(0);
}

if (mode !== "dev" && mode !== "prod") {
  console.error("Usage : node scripts/db-switch.mjs <dev|prod|status>");
  process.exit(1);
}

const content = readSchema();
if (!DATASOURCE_PATTERN.test(content)) {
  console.error(`❌ Bloc \`datasource db { ... }\` introuvable dans ${SCHEMA_PATH}`);
  process.exit(1);
}

const targetProvider = mode === "dev" ? "sqlite" : "postgresql";
const currentProvider = detectProvider(content);

if (currentProvider === targetProvider) {
  console.log(`✅ Schéma déjà en ${targetProvider} — rien à faire.`);
  process.exit(0);
}

const newBlock = mode === "dev" ? DEV_BLOCK : PROD_BLOCK;
const newContent = content.replace(DATASOURCE_PATTERN, newBlock);

writeFileSync(SCHEMA_PATH, newContent);
console.log(`✅ Schéma basculé : ${currentProvider} → ${targetProvider}`);

if (mode === "prod") {
  console.log("");
  console.log("⚠️  Vérifie que ton .env (ou Vercel env) contient bien :");
  console.log("    DATABASE_URL  = postgresql://...:6543/postgres?... (pooler Supabase)");
  console.log("    DIRECT_URL    = postgresql://...:5432/postgres?... (direct)");
}

regenerateClient();
