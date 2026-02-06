// src/config/loadConfig.ts
import path from "node:path";
import { pathToFileURL } from "node:url";
import fs from "node:fs";

export async function loadConfig(repoRoot: string) {
  const configPath = path.join(repoRoot, "patternier.config.mjs");


  if (!fs.existsSync(configPath)) {
    // config 없으면 기본값
    return { type: "fsd" as const };
  }

  const mod = await import(pathToFileURL(configPath).href);

  const cfg = mod?.config ?? mod?.default ?? null;
  if (!cfg || typeof cfg !== "object") {
    throw new Error(`Invalid config export in ${configPath}. Export "config" object.`);
  }
  return cfg;
}
