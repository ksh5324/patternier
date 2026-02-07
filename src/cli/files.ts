import path from "node:path";
import fs from "node:fs/promises";
import picomatch from "picomatch";

export const SOURCE_EXTS = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]);

// 기본 ignore는 config가 없어도 적용
const DEFAULT_IGNORES = [
  "**/node_modules/**",
  "**/dist/**",
  "**/.git/**",
] as const;

function normalizeRel(p: string) {
  return p.replaceAll(path.sep, "/");
}

function makeIsIgnored(ignores: readonly string[]) {
  const matcher = picomatch(ignores as string[]);
  return (relPath: string) => matcher(relPath);
}

async function listSourceFiles(
  dir: string,
  opts: { isIgnored: (relPath: string) => boolean }
): Promise<string[]> {
  const out: string[] = [];

  async function walk(current: string) {
    const entries = await fs.readdir(current, { withFileTypes: true });

    for (const e of entries) {
      if (e.name === "node_modules" || e.name === "dist" || e.name === ".git") continue;

      const full = path.join(current, e.name);

      if (e.isDirectory()) {
        const relDir = normalizeRel(path.relative(dir, full));
        if (opts.isIgnored(relDir) || opts.isIgnored(relDir + "/**")) continue;

        await walk(full);
        continue;
      }

      if (e.isFile()) {
        const ext = path.extname(e.name).toLowerCase();
        if (!SOURCE_EXTS.has(ext)) continue;

        const relFile = normalizeRel(path.relative(dir, full));
        if (opts.isIgnored(relFile)) continue;

        out.push(full);
      }
    }
  }

  await walk(dir);
  return out;
}

async function resolveFileArg(repoRoot: string, p: string) {
  const absPath = path.isAbsolute(p) ? p : path.join(repoRoot, p);
  const ext = path.extname(absPath).toLowerCase();
  if (!SOURCE_EXTS.has(ext)) {
    throw new Error(`Unsupported file extension: ${ext}`);
  }
  const st = await fs.stat(absPath);
  if (!st.isFile()) {
    throw new Error(`Not a file: ${absPath}`);
  }
  return absPath;
}

export {
  DEFAULT_IGNORES,
  normalizeRel,
  makeIsIgnored,
  listSourceFiles,
  resolveFileArg,
};
