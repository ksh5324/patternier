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
var FSD_LAYERS = ["app", "apps", "pages", "widgets", "features", "entities", "shared"];
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
  const lineStartByteOffsets = [0];
  const lineStartCodeUnitOffsets = [0];
  const charByteOffsets = [];
  const charCodeUnitOffsets = [];
  let byteOffset = 0;
  let codeUnitOffset = 0;
  for (const ch of code) {
    charByteOffsets.push(byteOffset);
    charCodeUnitOffsets.push(codeUnitOffset);
    const byteLen = Buffer.byteLength(ch, "utf8");
    const codeUnitLen = ch.length;
    if (ch === "\n") {
      lineStartByteOffsets.push(byteOffset + byteLen);
      lineStartCodeUnitOffsets.push(codeUnitOffset + codeUnitLen);
    }
    byteOffset += byteLen;
    codeUnitOffset += codeUnitLen;
  }
  function byteOffsetToCodeUnitOffset(offset) {
    let lo = 0;
    let hi = charByteOffsets.length - 1;
    let idx = -1;
    while (lo <= hi) {
      const mid = lo + hi >> 1;
      if (charByteOffsets[mid] <= offset) {
        idx = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return idx >= 0 ? charCodeUnitOffsets[idx] : 0;
  }
  function offsetToLoc(offset) {
    let lo = 0;
    let hi = lineStartByteOffsets.length - 1;
    while (lo <= hi) {
      const mid = lo + hi >> 1;
      if (lineStartByteOffsets[mid] <= offset) lo = mid + 1;
      else hi = mid - 1;
    }
    const lineIndex = Math.max(0, lo - 1);
    const line = lineIndex + 1;
    const codeUnitAt = byteOffsetToCodeUnitOffset(offset);
    const col = codeUnitAt - lineStartCodeUnitOffsets[lineIndex] + 1;
    return { line, col };
  }
  return { offsetToLoc };
}

// src/core/parse.ts
function locFromSpan(span, offsetToLoc, baseOffset) {
  if (!span || typeof span.start !== "number") return null;
  const relOffset = span.start - baseOffset + 1;
  return offsetToLoc(relOffset > 0 ? relOffset : span.start);
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
  const baseOffset = ast.span?.start ?? 1;
  const imports = [];
  const exports = [];
  const requires = [];
  const dynamicImports = [];
  const fetchCalls = [];
  const jsxUsages = [];
  const templateLiterals = [];
  let useClient = false;
  function walk(node) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const n of node) walk(n);
      return;
    }
    if (node.type === "CallExpression") {
      const callee = node.callee;
      const isFetchIdent = callee?.type === "Identifier" && callee.value === "fetch";
      const isFetchMember = callee?.type === "MemberExpression" && callee.property?.type === "Identifier" && callee.property.value === "fetch";
      if (isFetchIdent || isFetchMember) {
        fetchCalls.push({ loc: locFromSpan(node.span, offsetToLoc, baseOffset) });
      }
    }
    if (node.type === "JSXElement" || node.type === "JSXFragment") {
      jsxUsages.push({ loc: locFromSpan(node.span, offsetToLoc, baseOffset) });
    }
    if (node.type === "TemplateLiteral") {
      templateLiterals.push({ loc: locFromSpan(node.span, offsetToLoc, baseOffset) });
    }
    for (const key of Object.keys(node)) {
      if (key === "span") continue;
      const value = node[key];
      if (value && typeof value === "object") walk(value);
    }
  }
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
        loc: locFromSpan(stmt.span, offsetToLoc, baseOffset)
      });
      if (stmt.source?.value === "axios" || stmt.source?.value?.startsWith("axios/")) {
        fetchCalls.push({ loc: locFromSpan(stmt.span, offsetToLoc, baseOffset) });
      }
      continue;
    }
    if (stmt.type === "ExportAllDeclaration") {
      exports.push({
        kind: "exportAll",
        source: stmt.source?.value ?? null,
        loc: locFromSpan(stmt.span, offsetToLoc, baseOffset)
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
        loc: locFromSpan(stmt.span, offsetToLoc, baseOffset)
      });
      continue;
    }
  }
  walk(ast);
  return {
    imports,
    exports,
    requires,
    dynamicImports,
    fetchCalls,
    jsxUsages,
    templateLiterals,
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

// src/pattern/fsd/rules/uiNoSideEffects.ts
var RULE_ID = "@patternier/ui-no-side-effects";
function isUiFile(relPath) {
  return relPath.split("/").includes("ui");
}
function uiNoSideEffectsRule(ctx) {
  const diags = [];
  if (!isUiFile(ctx.file.relPath)) return diags;
  for (const fc of ctx.fetchCalls ?? []) {
    diags.push({
      ruleId: RULE_ID,
      message: "ui cannot use fetch/axios. Move side-effects to api/model layer.",
      loc: fc.loc ?? null
    });
  }
  return diags;
}

// src/pattern/fsd/rules/sliceNoUsage.ts
var RULE_ID2 = "@patternier/slice-no-usage";
var TARGET_LAYERS = /* @__PURE__ */ new Set(["features", "pages", "entities", "widgets", "apps"]);
var RESERVED_SEGMENTS = /* @__PURE__ */ new Set([
  "ui",
  "model",
  "lib",
  "utils",
  "config",
  "types",
  "constants",
  "assets",
  "styles",
  "hooks"
]);
function hasMissingSlice(relPath, layer) {
  const parts = relPath.split("/").filter(Boolean);
  if (!layer || !TARGET_LAYERS.has(layer)) return false;
  const second = parts[1];
  if (!second) return true;
  if (second.includes(".")) return true;
  if (RESERVED_SEGMENTS.has(second)) return true;
  return false;
}
function sliceNoUsageRule(ctx) {
  const diags = [];
  if (!hasMissingSlice(ctx.file.relPath, ctx.file.layer)) return diags;
  diags.push({
    ruleId: RULE_ID2,
    message: "layer requires a slice folder: <layer>/<slice>/...",
    loc: null
  });
  return diags;
}

// src/pattern/fsd/rules/modelNoPresentation.ts
var RULE_ID3 = "@patternier/model-no-presentation";
function isModelPath(relPath) {
  return relPath.split("/").includes("model");
}
function modelNoPresentationRule(ctx) {
  const diags = [];
  if (!isModelPath(ctx.file.relPath)) return diags;
  const jsxLocs = ctx.parsed?.jsxUsages ?? [];
  const tmplLocs = ctx.parsed?.templateLiterals ?? [];
  for (const j of jsxLocs) {
    diags.push({
      ruleId: RULE_ID3,
      message: "model cannot use JSX. Keep model layer pure.",
      loc: j.loc ?? null
    });
  }
  for (const t of tmplLocs) {
    diags.push({
      ruleId: RULE_ID3,
      message: "model cannot use template literals. Keep model layer pure.",
      loc: t.loc ?? null
    });
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
  },
  "@patternier/ui-no-side-effects": {
    run: uiNoSideEffectsRule,
    default: {
      level: "error"
    }
  },
  "@patternier/slice-no-usage": {
    run: sliceNoUsageRule,
    default: {
      level: "error",
      exclude: ["shared"]
    }
  },
  "@patternier/model-no-presentation": {
    run: modelNoPresentationRule,
    default: {
      level: "off"
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
    const diags = rule.run(
      {
        file,
        imports: parsed.imports,
        fetchCalls: parsed.fetchCalls,
        parsed
      },
      options
    );
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
    default:
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
  async function resolveFileArg(p) {
    const absPath = path4.isAbsolute(p) ? p : path4.join(repoRoot, p);
    const ext = path4.extname(absPath).toLowerCase();
    if (!SOURCE_EXTS.has(ext)) {
      throw new Error(`Unsupported file extension: ${ext}`);
    }
    const st = await fs4.stat(absPath);
    if (!st.isFile()) {
      throw new Error(`Not a file: ${absPath}`);
    }
    return absPath;
  }
  if (cmd === "inspect") {
    if (!fileArg) return usage();
    try {
      const absPath = await resolveFileArg(fileArg);
      const result = await inspectByType(config.type, absPath, ctx);
      process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    } catch (e) {
      console.error(e?.message || e);
      process.exitCode = 1;
    }
    return;
  }
  if (cmd === "check") {
    let targets = [];
    if (fileArg) {
      let absPath;
      try {
        absPath = await resolveFileArg(fileArg);
      } catch (e) {
        console.error(e?.message || e);
        process.exitCode = 1;
        return;
      }
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
      let result;
      try {
        result = await inspectByType(config.type, absPath, ctx);
      } catch (e) {
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
//# sourceMappingURL=cli.js.map