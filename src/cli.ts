// src/cli.ts
import path from "node:path";
import fs from "node:fs/promises";
import { loadConfig } from "./config/loadConfig";
import type { PatternType } from "./config/definePatternConfig";
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
  const { cmd, fileArg, cliType, format, help, version, summary, printConfig, explain, invalid } = parseArgs(process.argv);

  if (invalid) return usage();
  if (help) return usage();
  if (version) {
    const raw = await fs.readFile(new URL("../package.json", import.meta.url), "utf8");
    const pkg = JSON.parse(raw);
    console.log(pkg.version);
    return;
  }
  if (!cmd) return usage();

  if (cliType && cliType !== "fsd") {
    console.error(`Unknown type: ${cliType}`);
    process.exitCode = 1;
    return;
  }
  const cliTypeSafe: PatternType | undefined = cliType === "fsd" ? "fsd" : undefined;
  if (format && format !== "text" && format !== "json" && format !== "sarif") {
    console.error(`Unknown format: ${format}`);
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
  const effectiveType: PatternType = configExists ? config.type : (cliTypeSafe ?? config.type);
  const analysisRoot = path.join(repoRoot, config.rootDir ?? ".");

  if (printConfig) {
    process.stdout.write(JSON.stringify({ config, analysisRoot, type: effectiveType }, null, 2) + "\n");
    return;
  }

  const userIgnores = config.ignores ?? [];
  const ignoreFileMatcher = await readIgnoreFile(path.join(repoRoot, ".patternierignore"));

  const ignores = [
    ...DEFAULT_IGNORES,
    ...userIgnores,
  ];

  const isIgnored = makeIsIgnored(ignores, ignoreFileMatcher);

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
    const jsonDiags: any[] = [];
    const sarifDiags: any[] = [];
    const summaryCounts = new Map<string, number>();
    const explainMap = explain ? await getExplainMap(effectiveType) : null;

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
          const key = d.ruleId ?? "unknown";
          summaryCounts.set(key, (summaryCounts.get(key) ?? 0) + 1);
          if (format === "json") {
            jsonDiags.push({
              file: result.file.relPath,
              ruleId: d.ruleId,
              message: d.message,
              loc: d.loc ?? null,
              level: d.level ?? "error",
              explain: explainMap ? explainMap[d.ruleId] ?? null : undefined,
            });
          } else if (format === "sarif") {
            sarifDiags.push({
              file: result.file.relPath,
              ruleId: d.ruleId,
              message: d.message,
              loc: d.loc ?? null,
              level: d.level ?? "error",
            });
          } else {
            process.stdout.write(formatDiagnostic(result.file.relPath, d) + "\n");
          }
        }
      }
    }

    if (format === "json") {
      process.stdout.write(JSON.stringify(jsonDiags, null, 2) + "\n");
    } else if (format === "sarif") {
      process.stdout.write(JSON.stringify(buildSarif(sarifDiags), null, 2) + "\n");
    }
    if (summary) {
      const total = Array.from(summaryCounts.values()).reduce((a, b) => a + b, 0);
      process.stdout.write(`\nSummary: ${total} issues\n`);
      for (const [ruleId, count] of summaryCounts.entries()) {
        process.stdout.write(`- ${ruleId}: ${count}\n`);
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

function buildSarif(diags: any[]) {
  const rulesMap = new Map<string, { id: string }>();
  const results = diags.map((d) => {
    if (!rulesMap.has(d.ruleId)) rulesMap.set(d.ruleId, { id: d.ruleId });
    const location: any = {
      physicalLocation: {
        artifactLocation: { uri: d.file },
      },
    };
    if (d.loc && typeof d.loc.line === "number" && typeof d.loc.col === "number") {
      location.physicalLocation.region = {
        startLine: d.loc.line,
        startColumn: d.loc.col,
      };
    }
    return {
      ruleId: d.ruleId,
      level: d.level === "warn" ? "warning" : "error",
      message: { text: d.message },
      locations: [location],
    };
  });

  return {
    version: "2.1.0",
    $schema: "https://schemastore.azurewebsites.net/schemas/json/sarif-2.1.0.json",
    runs: [
      {
        tool: {
          driver: {
            name: "patternier",
            rules: Array.from(rulesMap.values()),
          },
        },
        results,
      },
    ],
  };
}

async function getExplainMap(type: PatternType): Promise<Record<string, string>> {
  if (type === "fsd") {
    const mod = await import("./pattern/fsd/rules/explain");
    return mod.fsdRuleExplain;
  }
  return {};
}
