// src/config/loadConfig.ts
import path from "node:path";
import { pathToFileURL } from "node:url";
import fs from "node:fs";
import type { PatternConfig } from "./definePatternConfig";

const CONFIG_RE = /^patternier\..+\.config\.mjs$/;

export async function loadConfig(repoRoot: string) {
  const configPath = await findConfigPath(repoRoot);
  if (!configPath) {
    return { type: "fsd" as const };
  }
  return loadConfigFromFile(configPath, new Set<string>());
}

async function findConfigPath(repoRoot: string) {
  const primary = path.join(repoRoot, "patternier.config.mjs");
  if (fs.existsSync(primary)) return primary;

  const entries = await fs.promises.readdir(repoRoot);
  const matches = entries.filter((e) => CONFIG_RE.test(e));
  if (matches.length === 0) return null;
  if (matches.length === 1) return path.join(repoRoot, matches[0]);

  const base = matches.find((m) => m === "patternier.base.config.mjs");
  if (base) return path.join(repoRoot, base);

  throw new Error(
    `Multiple patternier configs found in ${repoRoot}: ${matches.join(", ")}`
  );
}

async function loadConfigFromFile(
  configPath: string,
  seen: Set<string>
): Promise<PatternConfig> {
  const fullPath = path.resolve(configPath);
  if (seen.has(fullPath)) {
    throw new Error(`Circular config extends detected: ${fullPath}`);
  }
  seen.add(fullPath);

  const mod = await import(pathToFileURL(fullPath).href);
  const cfg = mod?.config ?? mod?.default ?? null;
  if (!cfg || typeof cfg !== "object") {
    throw new Error(`Invalid config export in ${fullPath}. Export "config" object.`);
  }

  const baseConfigs = await resolveExtends(cfg, path.dirname(fullPath), seen);
  return mergeConfigs(baseConfigs, cfg as PatternConfig);
}

async function resolveExtends(
  cfg: PatternConfig,
  dir: string,
  seen: Set<string>
): Promise<PatternConfig[]> {
  const exts = cfg.extends;
  if (!exts) return [];
  const list = Array.isArray(exts) ? exts : [exts];
  const out: PatternConfig[] = [];
  for (const e of list) {
    const p = path.isAbsolute(e) ? e : path.join(dir, e);
    out.push(await loadConfigFromFile(p, seen));
  }
  return out;
}

function mergeConfigs(...configs: PatternConfig[]): PatternConfig {
  const result: PatternConfig = { type: "fsd" };
  for (const cfg of configs) {
    Object.assign(result, cfg);
    if (cfg.layers) {
      result.layers = { ...(result.layers ?? {}), ...cfg.layers };
    }
    if (cfg.rules) {
      result.rules = { ...(result.rules ?? {}), ...cfg.rules };
    }
  }
  return result;
}
