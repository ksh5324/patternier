import path from "node:path";
import type { Tsconfig } from "./types";
import { dirEntriesCache } from "./cache";
import fs from "node:fs/promises";

const TS_EXTS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".vue"];

async function getDirEntries(dir: string): Promise<Set<string> | null> {
  if (dirEntriesCache.has(dir)) return dirEntriesCache.get(dir) ?? null;
  try {
    const entries = await fs.readdir(dir);
    const set = new Set(entries);
    dirEntriesCache.set(dir, set);
    return set;
  } catch (e: any) {
    if (e?.code === "ENOENT") {
      dirEntriesCache.set(dir, null);
      return null;
    }
    throw e;
  }
}

async function hasEntry(dir: string, name: string) {
  const entries = await getDirEntries(dir);
  return entries ? entries.has(name) : false;
}

async function tryResolveFile(absPath: string): Promise<string | null> {
  const dir = path.dirname(absPath);
  const base = path.basename(absPath);

  if (path.extname(absPath)) {
    if (await hasEntry(dir, base)) return absPath;
  }

  for (const ext of TS_EXTS) {
    const cand = base + ext;
    if (await hasEntry(dir, cand)) return path.join(dir, cand);
  }

  const dirEntries = await getDirEntries(absPath);
  if (dirEntries) {
    for (const ext of TS_EXTS) {
      const idx = "index" + ext;
      if (dirEntries.has(idx)) return path.join(absPath, idx);
    }
  }

  return null;
}

async function resolveRelative(source: string, fromFile: string): Promise<string | null> {
  if (!source.startsWith(".")) return null;
  const base = path.resolve(path.dirname(fromFile), source);
  return tryResolveFile(base);
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function resolveWithPaths(source: string, repoRoot: string, cfg: Tsconfig): Promise<string | null> {
  const entries = Object.entries(cfg.paths);
  for (const [pattern, targets] of entries) {
    if (!pattern) continue;
    const hasStar = pattern.includes("*");
    if (!hasStar) {
      if (pattern === source) {
        for (const t of targets) {
          const absBase = path.resolve(repoRoot, cfg.baseUrl, t);
          const resolved = await tryResolveFile(absBase);
          if (resolved) return resolved;
        }
      }
      continue;
    }

    const re = new RegExp("^" + escapeRegex(pattern).replace("\\*", "(.+)") + "$");
    const m = source.match(re);
    if (!m) continue;
    const star = m[1] ?? "";
    for (const t of targets) {
      const replaced = t.replace("*", star);
      const absBase = path.resolve(repoRoot, cfg.baseUrl, replaced);
      const resolved = await tryResolveFile(absBase);
      if (resolved) return resolved;
    }
  }
  return null;
}

export { tryResolveFile, resolveRelative, resolveWithPaths };
