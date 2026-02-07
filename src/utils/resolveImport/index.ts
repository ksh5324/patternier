import path from "node:path";
import { resolveCache, tsconfigCache } from "./cache";
import { resolveRelative, resolveWithPaths, tryResolveFile } from "./resolve";
import type { Tsconfig } from "./types";
import fs from "node:fs/promises";

async function loadTsconfig(repoRoot: string): Promise<Tsconfig | null> {
  const tsconfigPath = await findNearestTsconfig(repoRoot);
  if (!tsconfigPath) return null;
  if (tsconfigCache.has(tsconfigPath)) return tsconfigCache.get(tsconfigPath) ?? null;
  const cfg = await readTsconfig(tsconfigPath);
  tsconfigCache.set(tsconfigPath, cfg);
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
    const resolved = await resolveRelative(source, fromFile);
    resolveCache.set(cacheKey, resolved);
    return resolved;
  }

  const cfg = await loadTsconfig(repoRoot);
  if (cfg) {
    const byPaths = await resolveWithPaths(source, repoRoot, cfg);
    if (byPaths) {
      resolveCache.set(cacheKey, byPaths);
      return byPaths;
    }
  }

  if (source.startsWith("@/")) {
    const absBase = path.resolve(repoRoot, source.slice(2));
    const resolved = await tryResolveFile(absBase);
    resolveCache.set(cacheKey, resolved);
    return resolved;
  }

  resolveCache.set(cacheKey, null);
  return null;
}

export { resolveImportSource };

async function findNearestTsconfig(startDir: string): Promise<string | null> {
  let current = path.resolve(startDir);
  while (true) {
    const candidate = path.join(current, "tsconfig.json");
    try {
      await fs.access(candidate);
      return candidate;
    } catch {}
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

async function readTsconfig(tsconfigPath: string, seen = new Set<string>()): Promise<Tsconfig> {
  const full = path.resolve(tsconfigPath);
  if (seen.has(full)) {
    throw new Error(`Circular tsconfig extends detected: ${full}`);
  }
  seen.add(full);
  const raw = await fs.readFile(full, "utf8");
  const data = JSON.parse(raw);
  const base = data?.extends ? await resolveExtendedTsconfig(data.extends, path.dirname(full), seen) : null;
  const compilerOptions = {
    ...(base?.compilerOptions ?? {}),
    ...(data?.compilerOptions ?? {}),
  };
  const baseUrl = compilerOptions.baseUrl ?? ".";
  const paths = compilerOptions.paths ?? {};
  return { baseUrl, paths } as Tsconfig;
}

async function resolveExtendedTsconfig(
  ext: string,
  dir: string,
  seen: Set<string>
): Promise<any | null> {
  const exts = ext.endsWith(".json") ? ext : ext + ".json";
  const p = path.isAbsolute(exts) ? exts : path.join(dir, exts);
  try {
    await fs.access(p);
  } catch {
    return null;
  }
  const raw = await fs.readFile(p, "utf8");
  const data = JSON.parse(raw);
  if (data?.extends) {
    const parent = await resolveExtendedTsconfig(data.extends, path.dirname(p), seen);
    return {
      ...parent,
      ...data,
      compilerOptions: {
        ...(parent?.compilerOptions ?? {}),
        ...(data?.compilerOptions ?? {}),
      },
    };
  }
  return data;
}
