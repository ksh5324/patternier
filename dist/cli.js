#!/usr/bin/env node

// src/cli.ts
import path6 from "path";
import fs6 from "fs/promises";

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

// src/core/parse/index.ts
import fs2 from "fs/promises";
import path3 from "path";
import * as swc from "@swc/core";

// src/utils/makeOffsetToLoc/index.ts
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

// src/core/parse/loc.ts
function locFromSpan(span, offsetToLoc, baseOffset) {
  if (!span || typeof span.start !== "number") return null;
  const relOffset = span.start - baseOffset + 1;
  return offsetToLoc(relOffset > 0 ? relOffset : span.start);
}

// src/core/parse/collect.ts
function collectFromAst(ast, offsetToLoc, baseOffset, opts) {
  const imports = [];
  const exports = [];
  const requires = [];
  const dynamicImports = [];
  const fetchCalls = [];
  const jsxUsages = [];
  const templateLiterals = [];
  let useClient = false;
  const needsWalk = !!(opts?.needFetchCalls || opts?.needJsx || opts?.needTemplateLiterals);
  function walk(node) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const n of node) walk(n);
      return;
    }
    if (opts?.needFetchCalls && node.type === "CallExpression") {
      const callee = node.callee;
      const isFetchIdent = callee?.type === "Identifier" && callee.value === "fetch";
      const isFetchMember = callee?.type === "MemberExpression" && callee.property?.type === "Identifier" && callee.property.value === "fetch";
      if (isFetchIdent || isFetchMember) {
        fetchCalls.push({ loc: locFromSpan(node.span, offsetToLoc, baseOffset) });
      }
    }
    if (opts?.needJsx && (node.type === "JSXElement" || node.type === "JSXFragment")) {
      jsxUsages.push({ loc: locFromSpan(node.span, offsetToLoc, baseOffset) });
    }
    if (opts?.needTemplateLiterals && node.type === "TemplateLiteral") {
      templateLiterals.push({ loc: locFromSpan(node.span, offsetToLoc, baseOffset) });
    }
    for (const key of Object.keys(node)) {
      if (key === "span") continue;
      const value = node[key];
      if (value && typeof value === "object") walk(value);
    }
  }
  for (const stmt of ast.body ?? []) {
    if (opts?.needUseClient && stmt.type === "ExpressionStatement" && stmt.expression?.type === "StringLiteral" && stmt.expression.value === "use client") {
      useClient = true;
    }
    if (stmt.type === "ImportDeclaration") {
      imports.push({
        kind: "esm",
        source: stmt.source?.value ?? null,
        typeOnly: !!stmt.typeOnly,
        specifiers: (stmt.specifiers ?? []).map((s) => ({
          type: s.type,
          local: s.local?.value ?? null,
          imported: s.imported?.value ?? null
        })),
        loc: locFromSpan(stmt.span, offsetToLoc, baseOffset)
      });
      if (opts?.needFetchCalls && (stmt.source?.value === "axios" || stmt.source?.value?.startsWith("axios/"))) {
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
  if (needsWalk) walk(ast);
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

// src/core/parse/cache.ts
var parseCache = /* @__PURE__ */ new Map();
function makeOptionKey(opts) {
  return [
    opts?.needFetchCalls ? "f1" : "f0",
    opts?.needJsx ? "j1" : "j0",
    opts?.needTemplateLiterals ? "t1" : "t0",
    opts?.needUseClient ? "u1" : "u0"
  ].join("");
}

// src/core/parse/index.ts
async function parseFile(absPath, opts) {
  const st = await fs2.stat(absPath);
  const optionKey = makeOptionKey(opts);
  const cacheKey = absPath + "::" + optionKey;
  const cached = parseCache.get(cacheKey);
  if (cached && cached.mtimeMs === st.mtimeMs) return cached.result;
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
  const result = collectFromAst(ast, offsetToLoc, baseOffset, opts);
  parseCache.set(cacheKey, { mtimeMs: st.mtimeMs, key: optionKey, result });
  return result;
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
    const target = im.target ?? extractTargetFromSource(src);
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
    const target = im.target ?? extractTargetFromSource(src);
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
var DEFAULT_RESERVED_SEGMENTS = [
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
];
function hasMissingSlice(relPath, layer, reservedSegments) {
  const parts = relPath.split("/").filter(Boolean);
  if (!layer || !TARGET_LAYERS.has(layer)) return false;
  const second = parts[1];
  if (!second) return true;
  if (second.includes(".")) return true;
  if (reservedSegments.has(second)) return true;
  return false;
}
function sliceNoUsageRule(ctx, opts) {
  const diags = [];
  const reserved = /* @__PURE__ */ new Set([
    ...DEFAULT_RESERVED_SEGMENTS,
    ...opts?.reservedSegments ?? []
  ]);
  if (!hasMissingSlice(ctx.file.relPath, ctx.file.layer, reserved)) return diags;
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

// src/pattern/fsd/rules/useClientOnlyUi.ts
import picomatch from "picomatch";
var RULE_ID4 = "@patternier/use-client-only-ui";
var DEFAULT_ALLOW = ["**/ui/**"];
function matches(patterns, relPath) {
  if (!patterns || patterns.length === 0) return false;
  return picomatch(patterns)(relPath);
}
function useClientOnlyUiRule(ctx, opts) {
  const diags = [];
  if (!ctx.parsed?.directives?.useClient) return diags;
  const relPath = ctx.file.relPath;
  const allow = Array.isArray(opts?.allow) ? opts?.allow : opts?.allow ? [opts.allow] : DEFAULT_ALLOW;
  if (matches(opts?.exclude, relPath)) return diags;
  if (matches(allow, relPath)) return diags;
  diags.push({
    ruleId: RULE_ID4,
    message: '"use client" is only allowed under ui paths.',
    loc: null
  });
  return diags;
}

// src/pattern/fsd/rules/noDeepImport.ts
var RULE_ID5 = "@patternier/no-deep-import";
function getImportDepth(src) {
  const normalized = src.startsWith("@/") ? src.slice(2) : src;
  const parts = normalized.split("/").filter(Boolean);
  return parts.length;
}
function noDeepImportRule(ctx, opts) {
  const diags = [];
  const maxDepth = opts?.maxDepth ?? 3;
  for (const im of ctx.imports) {
    const src = im.source;
    if (!src) continue;
    if (src.startsWith(".")) continue;
    const depth = getImportDepth(src);
    if (depth > maxDepth) {
      diags.push({
        ruleId: RULE_ID5,
        message: `deep import is not allowed. Max depth is ${maxDepth}.`,
        loc: im.loc ?? null
      });
    }
  }
  return diags;
}

// src/pattern/fsd/rules/segmentNoUsage.ts
var RULE_ID6 = "@patternier/segment-no-usage";
var TARGET_LAYERS2 = /* @__PURE__ */ new Set(["features", "pages", "entities", "widgets", "apps"]);
var DEFAULT_SEGMENTS = [
  "ui",
  "model",
  "lib",
  "utils",
  "util",
  "helpers",
  "helper",
  "config",
  "configs",
  "types",
  "type",
  "constants",
  "constant",
  "assets",
  "asset",
  "styles",
  "style",
  "hooks",
  "hook",
  "api",
  "apis",
  "service",
  "services",
  "client",
  "clients",
  "repository",
  "repositories",
  "store",
  "stores",
  "state",
  "states",
  "schema",
  "schemas",
  "dto",
  "dtos",
  "query",
  "queries",
  "mutation",
  "mutations",
  "adapter",
  "adapters",
  "components",
  "component",
  "view",
  "views",
  "layout",
  "layouts",
  "presentation",
  "presenter",
  "render",
  "renders",
  "env",
  "runtime",
  "platform",
  "infra",
  "infrastructure",
  "server",
  "client-side",
  "shared-client",
  "shared-server",
  "tests",
  "test",
  "__tests__",
  "mocks",
  "__mocks__",
  "fixtures",
  "__fixtures__",
  "stories",
  "__stories__",
  "storybook",
  "example",
  "examples",
  "demo",
  "demos",
  "docs",
  "doc",
  "scripts",
  "tools",
  "tooling",
  "generators",
  "templates",
  "dist",
  "build",
  "out",
  "coverage",
  "public",
  "static",
  "vendor",
  "generated",
  "__generated__"
];
function hasMissingSegment(relPath, layer, segments) {
  const parts = relPath.split("/").filter(Boolean);
  if (!layer || !TARGET_LAYERS2.has(layer)) return false;
  const segment = parts[2];
  if (!segment) return true;
  if (segment.includes(".")) return true;
  if (!segments.has(segment)) return true;
  return false;
}
function segmentNoUsageRule(ctx, opts) {
  const diags = [];
  const segments = /* @__PURE__ */ new Set([
    ...DEFAULT_SEGMENTS,
    ...opts?.segments ?? []
  ]);
  if (!hasMissingSegment(ctx.file.relPath, ctx.file.layer, segments)) return diags;
  diags.push({
    ruleId: RULE_ID6,
    message: "slice requires a segment folder: <layer>/<slice>/<segment>/...",
    loc: null
  });
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
  },
  "@patternier/use-client-only-ui": {
    run: useClientOnlyUiRule,
    default: {
      level: "off",
      options: { allow: ["**/ui/**"] }
    }
  },
  "@patternier/no-deep-import": {
    run: noDeepImportRule,
    default: {
      level: "off",
      options: { maxDepth: 3 }
    }
  },
  "@patternier/segment-no-usage": {
    run: segmentNoUsageRule,
    default: {
      level: "error",
      exclude: ["shared"]
    }
  }
};

// src/utils/resolveImport/index.ts
import fs4 from "fs";
import path5 from "path";

// src/utils/resolveImport/cache.ts
var tsconfigCache = /* @__PURE__ */ new Map();
var resolveCache = /* @__PURE__ */ new Map();

// src/utils/resolveImport/resolve.ts
import fs3 from "fs";
import path4 from "path";
var TS_EXTS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
function tryResolveFile(absPath) {
  if (path4.extname(absPath)) {
    if (fs3.existsSync(absPath)) return absPath;
  }
  for (const ext of TS_EXTS) {
    const cand = absPath + ext;
    if (fs3.existsSync(cand)) return cand;
  }
  for (const ext of TS_EXTS) {
    const cand = path4.join(absPath, "index" + ext);
    if (fs3.existsSync(cand)) return cand;
  }
  return null;
}
function resolveRelative(source, fromFile) {
  if (!source.startsWith(".")) return null;
  const base = path4.resolve(path4.dirname(fromFile), source);
  return tryResolveFile(base);
}
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function resolveWithPaths(source, repoRoot, cfg) {
  const entries = Object.entries(cfg.paths);
  for (const [pattern, targets] of entries) {
    if (!pattern) continue;
    const hasStar = pattern.includes("*");
    if (!hasStar) {
      if (pattern === source) {
        for (const t of targets) {
          const absBase = path4.resolve(repoRoot, cfg.baseUrl, t);
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
      const absBase = path4.resolve(repoRoot, cfg.baseUrl, replaced);
      const resolved = tryResolveFile(absBase);
      if (resolved) return resolved;
    }
  }
  return null;
}

// src/utils/resolveImport/index.ts
async function loadTsconfig(repoRoot) {
  if (tsconfigCache.has(repoRoot)) return tsconfigCache.get(repoRoot) ?? null;
  const tsconfigPath = path5.join(repoRoot, "tsconfig.json");
  if (!fs4.existsSync(tsconfigPath)) {
    tsconfigCache.set(repoRoot, null);
    return null;
  }
  const raw = await fs4.promises.readFile(tsconfigPath, "utf8");
  const data = JSON.parse(raw);
  const compilerOptions = data?.compilerOptions ?? {};
  const baseUrl = compilerOptions.baseUrl ?? ".";
  const paths = compilerOptions.paths ?? {};
  const cfg = { baseUrl, paths };
  tsconfigCache.set(repoRoot, cfg);
  return cfg;
}
async function resolveImportSource(source, fromFile, repoRoot) {
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
    const absBase = path5.resolve(repoRoot, source.slice(2));
    const resolved = tryResolveFile(absBase);
    resolveCache.set(cacheKey, resolved);
    return resolved;
  }
  resolveCache.set(cacheKey, null);
  return null;
}

// src/pattern/fsd/inspect.ts
async function inspectFile(absPath, ctx) {
  const userRules = ctx.config.rules ?? {};
  const needs = {
    fetchCalls: false,
    jsx: false,
    template: false,
    useClient: false
  };
  for (const [ruleId, rule] of Object.entries(fsdRuleRegistry)) {
    const userSettingRaw = userRules[ruleId];
    const setting = normalizeRuleSetting(userSettingRaw, rule.default);
    if (setting.level === "off") continue;
    if (ruleId === "@patternier/ui-no-side-effects") needs.fetchCalls = true;
    if (ruleId === "@patternier/model-no-presentation") {
      needs.jsx = true;
      needs.template = true;
    }
    if (ruleId === "@patternier/use-client-only-ui") needs.useClient = true;
  }
  const file = getFsMeta(absPath, ctx.analysisRoot);
  const parsed = await parseFile(absPath, {
    needFetchCalls: needs.fetchCalls,
    needJsx: needs.jsx,
    needTemplateLiterals: needs.template,
    needUseClient: needs.useClient
  });
  const layerOrder = ctx.config.layers?.order ?? DEFAULT_FSD_LAYER_ORDER;
  const diagnostics = [];
  const resolvedImports = await Promise.all(
    parsed.imports.map(async (im) => {
      const resolvedPath = await resolveImportSource(im.source, absPath, ctx.repoRoot);
      const target = resolvedPath ? getFsMeta(resolvedPath, ctx.analysisRoot) : null;
      return { ...im, resolvedPath, target };
    })
  );
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
        imports: resolvedImports,
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

// src/utils/formatDiagnostic/index.ts
function formatDiagnostic(filePath, d) {
  const pos = d.loc ? `${d.loc.line}:${d.loc.col}` : "0:0";
  return `${filePath}:${pos}  ${d.ruleId}  ${d.message}`;
}

// src/cli.ts
import picomatch2 from "picomatch";

// src/utils/readIgnoreFile/index.ts
import fs5 from "fs/promises";
async function readIgnoreFile(absPath) {
  try {
    const raw = await fs5.readFile(absPath, "utf8");
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
  return p.replaceAll(path6.sep, "/");
}
function makeIsIgnored(ignores) {
  const matcher = picomatch2(ignores);
  return (relPath) => matcher(relPath);
}
async function listSourceFiles(dir, opts) {
  const out = [];
  async function walk(current) {
    const entries = await fs6.readdir(current, { withFileTypes: true });
    for (const e of entries) {
      if (e.name === "node_modules" || e.name === "dist" || e.name === ".git") continue;
      const full = path6.join(current, e.name);
      if (e.isDirectory()) {
        const relDir = normalizeRel(path6.relative(dir, full));
        if (opts.isIgnored(relDir) || opts.isIgnored(relDir + "/**")) continue;
        await walk(full);
        continue;
      }
      if (e.isFile()) {
        const ext = path6.extname(e.name).toLowerCase();
        if (!SOURCE_EXTS.has(ext)) continue;
        const relFile = normalizeRel(path6.relative(dir, full));
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
  const analysisRoot = path6.join(repoRoot, config.rootDir ?? ".");
  const userIgnores = config.ignores ?? [];
  const ignoreFilePatterns = await readIgnoreFile(path6.join(repoRoot, ".patternierignore"));
  const ignores = [
    ...DEFAULT_IGNORES,
    ...ignoreFilePatterns,
    ...userIgnores
  ];
  const isIgnored = makeIsIgnored(ignores);
  const ctx = { repoRoot, analysisRoot, config };
  async function resolveFileArg(p) {
    const absPath = path6.isAbsolute(p) ? p : path6.join(repoRoot, p);
    const ext = path6.extname(absPath).toLowerCase();
    if (!SOURCE_EXTS.has(ext)) {
      throw new Error(`Unsupported file extension: ${ext}`);
    }
    const st = await fs6.stat(absPath);
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
      const rel = normalizeRel(path6.relative(analysisRoot, absPath));
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