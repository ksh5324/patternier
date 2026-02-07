import fs from "node:fs";
import path from "node:path";
import type { Tsconfig } from "./types";

const TS_EXTS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];

function tryResolveFile(absPath: string): string | null {
  if (path.extname(absPath)) {
    if (fs.existsSync(absPath)) return absPath;
  }

  for (const ext of TS_EXTS) {
    const cand = absPath + ext;
    if (fs.existsSync(cand)) return cand;
  }

  for (const ext of TS_EXTS) {
    const cand = path.join(absPath, "index" + ext);
    if (fs.existsSync(cand)) return cand;
  }

  return null;
}

function resolveRelative(source: string, fromFile: string): string | null {
  if (!source.startsWith(".")) return null;
  const base = path.resolve(path.dirname(fromFile), source);
  return tryResolveFile(base);
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function resolveWithPaths(source: string, repoRoot: string, cfg: Tsconfig): string | null {
  const entries = Object.entries(cfg.paths);
  for (const [pattern, targets] of entries) {
    if (!pattern) continue;
    const hasStar = pattern.includes("*");
    if (!hasStar) {
      if (pattern === source) {
        for (const t of targets) {
          const absBase = path.resolve(repoRoot, cfg.baseUrl, t);
          const resolved = tryResolveFile(absBase);
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
      const resolved = tryResolveFile(absBase);
      if (resolved) return resolved;
    }
  }
  return null;
}

export { tryResolveFile, resolveRelative, resolveWithPaths };
