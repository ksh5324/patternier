#!/usr/bin/env node

// src/cli.ts
import path4 from "path";
import fs4 from "fs/promises";

// src/config/loadConfig.ts
import path from "path";
import { pathToFileURL } from "url";
import fs from "fs";
async function loadConfig(repoRoot) {
  const configPath = path.join(repoRoot, "patternier.config.mjs");
  if (!fs.existsSync(configPath)) {
    return { type: "fsd" };
  }
  const mod = await import(pathToFileURL(configPath).href);
  const cfg = mod?.config ?? mod?.default ?? null;
  if (!cfg || typeof cfg !== "object") {
    throw new Error(`Invalid config export in ${configPath}. Export "config" object.`);
  }
  return cfg;
}

// src/pattern/fsd/fsMeta.ts
import path2 from "path";
var FSD_LAYERS = ["app", "pages", "widgets", "features", "entities", "shared"];
function getFsMeta(absPath, repoRoot) {
  const relPath = path2.relative(repoRoot, absPath).replaceAll(path2.sep, "/");
  const parts = relPath.split("/");
  const layer = FSD_LAYERS.includes(parts[0] ?? "") ? parts[0] : "unknown";
  const slice = (layer === "features" || layer === "entities" || layer === "widgets") && parts.length >= 2 ? parts[1] : null;
  return {
    absPath,
    relPath,
    layer,
    slice
  };
}

// src/core/parse.ts
import fs2 from "fs/promises";
import path3 from "path";
import * as swc from "@swc/core";

// src/utils/makeOffsetToLoc.ts
function makeOffsetToLoc(code) {
  const lineStartOffsets = [0];
  for (let i = 0; i < code.length; i++) {
    if (code[i] === "\n") lineStartOffsets.push(i + 1);
  }
  function offsetToLoc(offset) {
    let lo = 0, hi = lineStartOffsets.length - 1;
    while (lo <= hi) {
      const mid = lo + hi >> 1;
      if (lineStartOffsets[mid] <= offset) lo = mid + 1;
      else hi = mid - 1;
    }
    const lineIndex = Math.max(0, lo - 1);
    const line = lineIndex + 1;
    const col = offset - lineStartOffsets[lineIndex] + 1;
    return { line, col };
  }
  return { offsetToLoc };
}

// src/core/parse.ts
function locFromSpan(span, offsetToLoc) {
  if (!span || typeof span.start !== "number") return null;
  return offsetToLoc(span.start);
}
async function parseFile(absPath) {
  const code = await fs2.readFile(absPath, "utf8");
  const { offsetToLoc } = makeOffsetToLoc(code);
  const ext = path3.extname(absPath).toLowerCase();
  const syntax = ext === ".ts" || ext === ".tsx" ? "typescript" : "ecmascript";
  const tsx = ext === ".tsx" || ext === ".jsx";
  const ast = await swc.parse(code, {
    syntax,
    tsx,
    decorators: true,
    dynamicImport: true
  });
  const imports = [];
  const exports = [];
  const requires = [];
  const dynamicImports = [];
  let useClient = false;
  for (const stmt of ast.body ?? []) {
    if (stmt.type === "ExpressionStatement" && stmt.expression?.type === "StringLiteral" && stmt.expression.value === "use client") {
      useClient = true;
    }
    if (stmt.type === "ImportDeclaration") {
      imports.push({
        kind: "esm",
        source: stmt.source?.value ?? null,
        typeOnly: !!stmt.typeOnly,
        specifiers: (stmt.specifiers ?? []).map((s) => ({
          type: s.type,
          // ImportDefaultSpecifier / ImportNamespaceSpecifier / ImportSpecifier
          local: s.local?.value ?? null,
          imported: s.imported?.value ?? null
        })),
        loc: locFromSpan(stmt.span, offsetToLoc)
      });
      continue;
    }
    if (stmt.type === "ExportAllDeclaration") {
      exports.push({
        kind: "exportAll",
        source: stmt.source?.value ?? null,
        loc: locFromSpan(stmt.span, offsetToLoc)
      });
      continue;
    }
    if (stmt.type === "ExportNamedDeclaration") {
      exports.push({
        kind: "exportNamed",
        source: stmt.source?.value ?? null,
        specifiers: (stmt.specifiers ?? []).map((s) => ({
          type: s.type,
          local: s.orig?.value ?? null,
          exported: s.exported?.value ?? null
        })),
        loc: locFromSpan(stmt.span, offsetToLoc)
      });
      continue;
    }
  }
  return {
    imports,
    exports,
    requires,
    dynamicImports,
    directives: { useClient }
  };
}

// src/pattern/fsd/constants.ts
var DEFAULT_FSD_LAYER_ORDER = [
  "app",
  "pages",
  "widgets",
  "features",
  "entities",
  "shared"
];

// src/pattern/fsd/utils/shouldSkipByLayer.ts
function shouldSkipByLayer(fileLayer, setting) {
  if (setting.include?.length) return !setting.include.includes(fileLayer);
  if (setting.exclude?.length) return setting.exclude.includes(fileLayer);
  return false;
}

// src/pattern/fsd/utils/nomalizeRule.ts
function normalizeRuleSetting(x, defaultSetting) {
  if (x === "off" || x === "warn" || x === "error")
    return {
      level: x,
      include: defaultSetting.include,
      exclude: defaultSetting.exclude,
      options: defaultSetting.options
    };
  if (x && typeof x === "object") {
    return {
      level: x.level ?? defaultSetting.level,
      include: x.include ?? defaultSetting.include,
      exclude: x.exclude ?? defaultSetting.exclude,
      options: x.options ?? defaultSetting.options
    };
  }
  return defaultSetting;
}

// src/pattern/fsd/utils/extractTarget.ts
var LAYERS = ["app", "pages", "widgets", "features", "entities", "shared"];
function extractTargetFromSource(source) {
  const normalized = source.startsWith("@/") ? source.slice(2) : source;
  const parts = normalized.split("/").filter(Boolean);
  const layer = parts[0];
  if (!layer || !LAYERS.includes(layer)) return null;
  const slice = (layer === "features" || layer === "entities" || layer === "widgets") && parts.length >= 2 ? parts[1] : null;
  return { layer, slice };
}
function getLayerIndex(layer, order) {
  return order.indexOf(layer);
}

// src/pattern/fsd/rules/noLayerToHigherImport.ts
function noLayerToHigherImportRule(ctx, opts) {
  const diags = [];
  const fromLayer = ctx.file.layer;
  const fromIdx = getLayerIndex(fromLayer, opts.order);
  if (fromIdx === -1) return diags;
  for (const im of ctx.imports) {
    const src = im.source;
    if (!src) continue;
    const target = extractTargetFromSource(src);
    if (!target) continue;
    const toIdx = getLayerIndex(target.layer, opts.order);
    if (toIdx === -1) continue;
    const isImportingHigher = toIdx < fromIdx;
    if (isImportingHigher) {
      diags.push({
        ruleId: "@patternier/no-layer-to-higher-import",
        message: `${fromLayer} cannot import from higher layer ${target.layer}.`,
        loc: im.loc ?? null
      });
    }
  }
  return diags;
}

// src/pattern/fsd/rules/noCrossSliceImport.ts
function noCrossSliceImportRule(ctx, opts) {
  const diags = [];
  const fromLayer = ctx.file.layer;
  const fromSlice = ctx.file.slice;
  if (!opts.layers.includes(fromLayer)) return diags;
  if (!fromSlice) return diags;
  for (const im of ctx.imports) {
    const src = im.source;
    if (!src) continue;
    const target = extractTargetFromSource(src);
    if (!target) continue;
    if (target.layer === fromLayer) {
      const toSlice = target.slice;
      if (toSlice && toSlice !== fromSlice) {
        diags.push({
          ruleId: "@patternier/no-cross-slice-import",
          message: `${fromLayer}/${fromSlice} cannot import from ${fromLayer}/${toSlice}. Use shared/entities or expose via public API.`,
          loc: im.loc ?? null
        });
      }
    }
  }
  return diags;
}

// src/pattern/fsd/rules/index.ts
var fsdRuleRegistry = {
  "@patternier/no-layer-to-higher-import": {
    run: noLayerToHigherImportRule,
    default: {
      level: "error"
    }
  },
  "@patternier/no-cross-slice-import": {
    run: noCrossSliceImportRule,
    default: {
      level: "error",
      options: { layers: ["features"] }
    }
  }
};

// src/pattern/fsd/inspect.ts
async function inspectFile(absPath, ctx) {
  const file = getFsMeta(absPath, ctx.analysisRoot);
  const parsed = await parseFile(absPath);
  const layerOrder = ctx.config.layers?.order ?? DEFAULT_FSD_LAYER_ORDER;
  const diagnostics = [];
  const userRules = ctx.config.rules ?? {};
  for (const [ruleId, rule] of Object.entries(fsdRuleRegistry)) {
    const userSettingRaw = userRules[ruleId];
    const setting = normalizeRuleSetting(userSettingRaw, rule.default);
    if (setting.level === "off") continue;
    if (shouldSkipByLayer(file.layer, setting)) continue;
    const options = {
      // 공통 옵션들
      order: layerOrder,
      // 유저가 rule별로 넣은 options
      ...setting.options ?? {}
    };
    const diags = rule.run({ file, imports: parsed.imports }, options);
    for (const d of diags) {
      diagnostics.push({ ...d, level: setting.level });
    }
  }
  return { file, ...parsed, diagnostics };
}

// src/entry/inspectByType.ts
async function inspectByType(type, absPath, ctx) {
  switch (type) {
    case "fsd":
      return inspectFile(absPath, ctx);
  }
}

// src/utils/formatDiagnostic.ts
function formatDiagnostic(filePath, d) {
  const pos = d.loc ? `${d.loc.line}:${d.loc.col}` : "0:0";
  return `${filePath}:${pos}  ${d.ruleId}  ${d.message}`;
}

// src/cli.ts
import picomatch from "picomatch";

// src/utils/readIgnoreFile.ts
import fs3 from "fs/promises";
async function readIgnoreFile(absPath) {
  try {
    const raw = await fs3.readFile(absPath, "utf8");
    return raw.split(/\r?\n/g).map((l) => l.trim()).filter((l) => l.length > 0).filter((l) => !l.startsWith("#"));
  } catch (e) {
    if (e?.code === "ENOENT") return [];
    throw e;
  }
}

// src/cli.ts
var cwd = process.cwd();
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
var SOURCE_EXTS = /* @__PURE__ */ new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]);
var DEFAULT_IGNORES = [
  "**/node_modules/**",
  "**/dist/**",
  "**/.git/**"
];
function normalizeRel(p) {
  return p.replaceAll(path4.sep, "/");
}
function makeIsIgnored(ignores) {
  const matcher = picomatch(ignores);
  return (relPath) => matcher(relPath);
}
async function listSourceFiles(dir, opts) {
  const out = [];
  async function walk(current) {
    const entries = await fs4.readdir(current, { withFileTypes: true });
    for (const e of entries) {
      if (e.name === "node_modules" || e.name === "dist" || e.name === ".git") continue;
      const full = path4.join(current, e.name);
      if (e.isDirectory()) {
        const relDir = normalizeRel(path4.relative(dir, full));
        if (opts.isIgnored(relDir) || opts.isIgnored(relDir + "/**")) continue;
        await walk(full);
        continue;
      }
      if (e.isFile()) {
        const ext = path4.extname(e.name).toLowerCase();
        if (!SOURCE_EXTS.has(ext)) continue;
        const relFile = normalizeRel(path4.relative(dir, full));
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
  const analysisRoot = path4.join(repoRoot, config.rootDir ?? ".");
  const userIgnores = config.ignores ?? [];
  const ignoreFilePatterns = await readIgnoreFile(path4.join(repoRoot, ".patternierignore"));
  const ignores = [
    ...DEFAULT_IGNORES,
    ...ignoreFilePatterns,
    ...userIgnores
  ];
  const isIgnored = makeIsIgnored(ignores);
  const ctx = { repoRoot, analysisRoot, config };
  if (cmd === "inspect") {
    if (!fileArg) return usage();
    const absPath = path4.isAbsolute(fileArg) ? fileArg : path4.join(repoRoot, fileArg);
    const result = await inspectByType(config.type, absPath, ctx);
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    return;
  }
  if (cmd === "check") {
    let targets = [];
    if (fileArg) {
      const absPath = path4.isAbsolute(fileArg) ? fileArg : path4.join(repoRoot, fileArg);
      const rel = normalizeRel(path4.relative(analysisRoot, absPath));
      if (rel.startsWith("..")) {
        targets = [absPath];
      } else if (!isIgnored(rel)) {
        targets = [absPath];
      } else {
        process.exitCode = 0;
        return;
      }
    } else {
      targets = await listSourceFiles(analysisRoot, { isIgnored });
    }
    let hasError = false;
    for (const absPath of targets) {
      const result = await inspectByType(config.type, absPath, ctx);
      const diags = result.diagnostics ?? [];
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
//# sourceMappingURL=cli.js.map