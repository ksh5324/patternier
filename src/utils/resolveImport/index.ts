import fs from "node:fs";
import path from "node:path";
import { resolveCache, tsconfigCache } from "./cache";
import { resolveRelative, resolveWithPaths, tryResolveFile } from "./resolve";
import type { Tsconfig } from "./types";

async function loadTsconfig(repoRoot: string): Promise<Tsconfig | null> {
  if (tsconfigCache.has(repoRoot)) return tsconfigCache.get(repoRoot) ?? null;
  const tsconfigPath = path.join(repoRoot, "tsconfig.json");
  if (!fs.existsSync(tsconfigPath)) {
    tsconfigCache.set(repoRoot, null);
    return null;
  }
  const raw = await fs.promises.readFile(tsconfigPath, "utf8");
  const data = JSON.parse(raw);
  const compilerOptions = data?.compilerOptions ?? {};
  const baseUrl = compilerOptions.baseUrl ?? ".";
  const paths = compilerOptions.paths ?? {};
  const cfg = { baseUrl, paths } as Tsconfig;
  tsconfigCache.set(repoRoot, cfg);
  return cfg;
}

async function resolveImportSource(
  source: string | null,
  fromFile: string,
  repoRoot: string
): Promise<string | null> {
  if (!source) return null;
  const cacheKey = fromFile + "::" + source;
  if (resolveCache.has(cacheKey)) return resolveCache.get(cacheKey) ?? null;

  if (source.startsWith(".")) {
    const resolved = resolveRelative(source, fromFile);
    resolveCache.set(cacheKey, resolved);
    return resolved;
  }

  const cfg = await loadTsconfig(repoRoot);
  if (cfg) {
    const byPaths = resolveWithPaths(source, repoRoot, cfg);
    if (byPaths) {
      resolveCache.set(cacheKey, byPaths);
      return byPaths;
    }
  }

  if (source.startsWith("@/")) {
    const absBase = path.resolve(repoRoot, source.slice(2));
    const resolved = tryResolveFile(absBase);
    resolveCache.set(cacheKey, resolved);
    return resolved;
  }

  resolveCache.set(cacheKey, null);
  return null;
}

export { resolveImportSource };
