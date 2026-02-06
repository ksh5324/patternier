import fs from "node:fs";
import path from "node:path";

type Tsconfig = {
  baseUrl: string;
  paths: Record<string, string[]>;
};

const TS_EXTS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
const tsconfigCache = new Map<string, Tsconfig | null>();

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

export async function resolveImportSource(
  source: string | null,
  fromFile: string,
  repoRoot: string
): Promise<string | null> {
  if (!source) return null;
  if (source.startsWith("."))
    return resolveRelative(source, fromFile);

  const cfg = await loadTsconfig(repoRoot);
  if (cfg) {
    const byPaths = resolveWithPaths(source, repoRoot, cfg);
    if (byPaths) return byPaths;
  }

  if (source.startsWith("@/")) {
    const absBase = path.resolve(repoRoot, source.slice(2));
    return tryResolveFile(absBase);
  }

  return null;
}
