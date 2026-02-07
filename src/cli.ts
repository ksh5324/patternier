// src/cli.ts
import path from "node:path";
import fs from "node:fs/promises";
import { loadConfig } from "./config/loadConfig";
import { inspectByType } from "./entry/inspectByType";
import { formatDiagnostic } from "./utils/formatDiagnostic";
import { readIgnoreFile } from "./utils/readIgnoreFile";
import { parseArgs } from "./cli/args";
import { usage } from "./cli/usage";
import {
  DEFAULT_IGNORES,
  normalizeRel,
  makeIsIgnored,
  listSourceFiles,
  resolveFileArg,
} from "./cli/files";


const cwd = process.cwd();

async function main() {
  const { cmd, fileArg, cliType, invalid } = parseArgs(process.argv);

  if (invalid) return usage();
  if (!cmd) return usage();

  if (cliType && cliType !== "fsd") {
    console.error(`Unknown type: ${cliType}`);
    process.exitCode = 1;
    return;
  }

  const repoRoot = cwd;
  const configPath = path.join(repoRoot, "patternier.config.mjs");
  let configExists = false;
  try {
    await fs.stat(configPath);
    configExists = true;
  } catch {}
  const config = await loadConfig(repoRoot);
  const effectiveType = configExists ? config.type : (cliType ?? config.type);
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

  if (cmd === "inspect") {
    if (!fileArg) return usage();

    try {
      const absPath = await resolveFileArg(repoRoot, fileArg);

      // inspect는 보통 강제 분석이 편하지만, 원하면 ignore도 적용 가능
      // 여기서는 "inspect는 무조건 실행"으로 둔다.
      const result = await inspectByType(effectiveType, absPath, ctx);
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
        absPath = await resolveFileArg(repoRoot, fileArg);
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
        result = await inspectByType(effectiveType, absPath, ctx);
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
