// src/cli.ts
import path from "node:path";
import fs from "node:fs/promises";
import { loadConfig } from "./config/loadConfig";
import { inspectByType } from "./entry/inspectByType";
import { formatDiagnostic } from "./utils/formatDiagnostic";
import picomatch from "picomatch";
import { readIgnoreFile } from "./utils/readIgnoreFile";


const cwd = process.cwd();

function usage() {
  console.log(`patternier

Usage:
  patternier inspect <file>
  patternier check [file]

Examples:
  pnpm dev inspect fixtures/features/a/index.ts
  pnpm dev check fixtures/features/a/index.ts
  pnpm dev check
`);
}

const SOURCE_EXTS = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]);

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
  // picomatch는 배열 패턴을 받아 matcher 함수를 만들어줌
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
      // 빠른 디렉토리 스킵 (glob과 별개로 성능/안전)
      if (e.name === "node_modules" || e.name === "dist" || e.name === ".git") continue;

      const full = path.join(current, e.name);

      if (e.isDirectory()) {
        // 디렉토리도 ignore 매칭되면 아예 하위 스캔 안 함 (성능↑)
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

async function main() {
  const [, , cmd, fileArg] = process.argv;

  if (!cmd) return usage();

  const repoRoot = cwd;
  const config = await loadConfig(repoRoot);
  const analysisRoot = path.join(repoRoot, config.rootDir ?? ".");

  const userIgnores = config.ignores ?? [];
  const ignoreFilePatterns = await readIgnoreFile(path.join(repoRoot, ".patternierignore"));

  const ignores = [
    ...DEFAULT_IGNORES,
    ...ignoreFilePatterns,
    ...userIgnores,
  ];

  const isIgnored = makeIsIgnored(ignores);

  const ctx = { repoRoot, analysisRoot, config };

  async function resolveFileArg(p: string) {
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

  if (cmd === "inspect") {
    if (!fileArg) return usage();

    try {
      const absPath = await resolveFileArg(fileArg);

      // inspect는 보통 강제 분석이 편하지만, 원하면 ignore도 적용 가능
      // 여기서는 "inspect는 무조건 실행"으로 둔다.
      const result = await inspectByType(config.type, absPath, ctx);
      process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    } catch (e: any) {
      console.error(e?.message || e);
      process.exitCode = 1;
    }
    return;
  }

  if (cmd === "check") {
    let targets: string[] = [];

    if (fileArg) {
      let absPath: string;
      try {
        absPath = await resolveFileArg(fileArg);
      } catch (e: any) {
        console.error(e?.message || e);
        process.exitCode = 1;
        return;
      }

      // ✅ check <file>도 ignores 적용 (원하면 나중에 --no-ignore 추가)
      const rel = normalizeRel(path.relative(analysisRoot, absPath));
      if (rel.startsWith("..")) {
        // analysisRoot 밖이면 그냥 검사(사용자가 명시했으니까)
        targets = [absPath];
      } else if (!isIgnored(rel)) {
        targets = [absPath];
      } else {
        // ignore 대상이면 조용히 통과 처리
        process.exitCode = 0;
        return;
      }
    } else {
      // ✅ 인자 없으면 rootDir 하위 전체 검사 + ignores 필터
      targets = await listSourceFiles(analysisRoot, { isIgnored });
    }

    let hasError = false;

    for (const absPath of targets) {
      let result: any;
      try {
        result = await inspectByType(config.type, absPath, ctx);
      } catch (e: any) {
        hasError = true;
        console.error(e?.message || e);
        continue;
      }
      const diags = result?.diagnostics ?? [];

      if (diags.length > 0) {
        hasError = true;
        for (const d of diags) {
          process.stdout.write(formatDiagnostic(result.file.relPath, d) + "\n");
        }
      }
    }

    process.exitCode = hasError ? 1 : 0;
    return;
  }

  usage();
}

main().catch((e) => {
  console.error(e?.stack || e);
  process.exitCode = 1;
});
