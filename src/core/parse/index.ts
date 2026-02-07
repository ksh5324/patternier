import fs from "node:fs/promises";
import path from "node:path";
import * as swc from "@swc/core";
import { makeOffsetToLoc } from "@/utils/makeOffsetToLoc";
import { parse as parseSfc } from "@vue/compiler-sfc";
import { collectFromAst } from "./collect";
import { parseCache, makeOptionKey } from "./cache";
import type { ParseOptions, ParsedResult } from "./types";

export type { ParseOptions, ParsedResult, ParsedImport, Loc } from "./types";

async function parseFile(absPath: string, opts?: ParseOptions): Promise<ParsedResult> {
  const st = await fs.stat(absPath);
  const optionKey = makeOptionKey(opts);
  const cacheKey = absPath + "::" + optionKey;
  const cached = parseCache.get(cacheKey);
  if (cached && cached.mtimeMs === st.mtimeMs) return cached.result;

  const code = await fs.readFile(absPath, "utf8");
  const { offsetToLoc } = makeOffsetToLoc(code);

  const ext = path.extname(absPath).toLowerCase();
  let result: ParsedResult;

  if (ext === ".vue") {
    const sfc = parseSfc(code, { filename: absPath });
    const blocks = [sfc.descriptor.script, sfc.descriptor.scriptSetup].filter(Boolean);
    result = emptyResult();

    for (const block of blocks) {
      const content = block?.content ?? "";
      const lang = block?.lang ?? "js";
      const syntax = lang === "ts" || lang === "tsx" ? "typescript" : "ecmascript";
      const tsx = lang === "tsx" || lang === "jsx";
      const startIndex = block?.loc?.start?.offset ?? 0;
      const byteOffset = Buffer.byteLength(code.slice(0, startIndex), "utf8");
      const offsetToLocWithShift = (n: number) => offsetToLoc(n + byteOffset);

      const partial = await parseWithSwc(content, syntax, tsx, offsetToLocWithShift, opts);
      result = mergeResults(result, partial);
    }
  } else {
    const syntax = ext === ".ts" || ext === ".tsx" ? "typescript" : "ecmascript";
    const tsx = ext === ".tsx" || ext === ".jsx";
    result = await parseWithSwc(code, syntax, tsx, offsetToLoc, opts);
  }

  parseCache.set(cacheKey, { mtimeMs: st.mtimeMs, key: optionKey, result });
  return result;
}

async function parseWithSwc(
  code: string,
  syntax: "ecmascript" | "typescript",
  tsx: boolean,
  offsetToLoc: (n: number) => { line: number; col: number },
  opts?: ParseOptions
) {
  const ast = await swc.parse(code, {
    syntax,
    tsx,
    decorators: true,
    dynamicImport: true,
  } as any);
  const baseOffset = (ast as any).span?.start ?? 1;
  return collectFromAst(ast, offsetToLoc, baseOffset, opts);
}

function emptyResult(): ParsedResult {
  return {
    imports: [],
    exports: [],
    requires: [],
    dynamicImports: [],
    fetchCalls: [],
    jsxUsages: [],
    templateLiterals: [],
    directives: { useClient: false },
  };
}

function mergeResults(a: ParsedResult, b: ParsedResult): ParsedResult {
  return {
    imports: [...a.imports, ...b.imports],
    exports: [...a.exports, ...b.exports],
    requires: [...a.requires, ...b.requires],
    dynamicImports: [...a.dynamicImports, ...b.dynamicImports],
    fetchCalls: [...a.fetchCalls, ...b.fetchCalls],
    jsxUsages: [...a.jsxUsages, ...b.jsxUsages],
    templateLiterals: [...a.templateLiterals, ...b.templateLiterals],
    directives: { useClient: a.directives.useClient || b.directives.useClient },
  };
}

export { parseFile };
