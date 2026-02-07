// src/pattern/fsd/parse.ts
import fs from "node:fs/promises";
import path from "node:path";
import * as swc from "@swc/core";
import { makeOffsetToLoc } from "@/utils/makeOffsetToLoc";

export type Loc = { line: number; col: number };
export type ParsedImport = {
  kind: "esm";
  source: string | null;
  typeOnly: boolean;
  specifiers: { type: string; local: string | null; imported: string | null }[];
  loc: Loc | null;
};
export type ParsedResult = {
  imports: ParsedImport[];
  exports: any[];
  requires: any[];
  dynamicImports: any[];
  fetchCalls: { loc: Loc | null }[];
  jsxUsages: { loc: Loc | null }[];
  templateLiterals: { loc: Loc | null }[];
  directives: { useClient: boolean };
};

function locFromSpan(
  span: any,
  offsetToLoc: (n: number) => { line: number; col: number },
  baseOffset: number
) {
  if (!span || typeof span.start !== "number") return null;
  const relOffset = span.start - baseOffset + 1;
  return offsetToLoc(relOffset > 0 ? relOffset : span.start);
}

type ParseOptions = {
  needFetchCalls?: boolean;
  needJsx?: boolean;
  needTemplateLiterals?: boolean;
  needUseClient?: boolean;
};

type ParseCacheEntry = {
  mtimeMs: number;
  key: string;
  result: any;
};

const parseCache = new Map<string, ParseCacheEntry>();

function makeOptionKey(opts?: ParseOptions) {
  return [
    opts?.needFetchCalls ? "f1" : "f0",
    opts?.needJsx ? "j1" : "j0",
    opts?.needTemplateLiterals ? "t1" : "t0",
    opts?.needUseClient ? "u1" : "u0",
  ].join("");
}

export async function parseFile(absPath: string, opts?: ParseOptions): Promise<ParsedResult> {
  const st = await fs.stat(absPath);
  const optionKey = makeOptionKey(opts);
  const cacheKey = absPath + "::" + optionKey;
  const cached = parseCache.get(cacheKey);
  if (cached && cached.mtimeMs === st.mtimeMs) return cached.result;

  const code = await fs.readFile(absPath, "utf8");
  const { offsetToLoc } = makeOffsetToLoc(code);

  const ext = path.extname(absPath).toLowerCase();

  const syntax = ext === ".ts" || ext === ".tsx" ? "typescript" : "ecmascript";
  const tsx = ext === ".tsx" || ext === ".jsx";

  const ast = await swc.parse(code, {
    syntax,
    tsx,
    decorators: true,
    dynamicImport: true,
  } as any);

  const baseOffset = (ast as any).span?.start ?? 1;

  const imports: ParsedImport[] = [];
  const exports: any[] = [];
  const requires: any[] = [];
  const dynamicImports: any[] = [];
  const fetchCalls: { loc: Loc | null }[] = [];
  const jsxUsages: { loc: Loc | null }[] = [];
  const templateLiterals: { loc: Loc | null }[] = [];
  let useClient = false;

  const needsWalk = !!(opts?.needFetchCalls || opts?.needJsx || opts?.needTemplateLiterals);

  function walk(node: any) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const n of node) walk(n);
      return;
    }

    if (opts?.needFetchCalls && node.type === "CallExpression") {
      const callee = node.callee;
      const isFetchIdent = callee?.type === "Identifier" && callee.value === "fetch";
      const isFetchMember =
        callee?.type === "MemberExpression" &&
        callee.property?.type === "Identifier" &&
        callee.property.value === "fetch";
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
      const value = (node as any)[key];
      if (value && typeof value === "object") walk(value);
    }
  }

  for (const stmt of (ast as any).body ?? []) {
    if (
      opts?.needUseClient &&
      stmt.type === "ExpressionStatement" &&
      stmt.expression?.type === "StringLiteral" &&
      stmt.expression.value === "use client"
    ) {
      useClient = true;
    }

    if (stmt.type === "ImportDeclaration") {
      imports.push({
        kind: "esm",
        source: stmt.source?.value ?? null,
        typeOnly: !!stmt.typeOnly,
        specifiers: (stmt.specifiers ?? []).map((s: any) => ({
          type: s.type, // ImportDefaultSpecifier / ImportNamespaceSpecifier / ImportSpecifier
          local: s.local?.value ?? null,
          imported: s.imported?.value ?? null,
        })),
        loc: locFromSpan(stmt.span, offsetToLoc, baseOffset),
      });
      if (
        opts?.needFetchCalls &&
        (stmt.source?.value === "axios" || stmt.source?.value?.startsWith("axios/"))
      ) {
        fetchCalls.push({ loc: locFromSpan(stmt.span, offsetToLoc, baseOffset) });
      }
      continue;
    }

    if (stmt.type === "ExportAllDeclaration") {
      exports.push({
        kind: "exportAll",
        source: stmt.source?.value ?? null,
        loc: locFromSpan(stmt.span, offsetToLoc, baseOffset),
      });
      continue;
    }

    if (stmt.type === "ExportNamedDeclaration") {
      exports.push({
        kind: "exportNamed",
        source: stmt.source?.value ?? null,
        specifiers: (stmt.specifiers ?? []).map((s: any) => ({
          type: s.type,
          local: s.orig?.value ?? null,
          exported: s.exported?.value ?? null,
        })),
        loc: locFromSpan(stmt.span, offsetToLoc, baseOffset),
      });
      continue;
    }
  }

  if (needsWalk) walk(ast as any);

  const result = {
    imports,
    exports,
    requires,
    dynamicImports,
    fetchCalls,
    jsxUsages,
    templateLiterals,
    directives: { useClient },
  };
  parseCache.set(cacheKey, { mtimeMs: st.mtimeMs, key: optionKey, result });
  return result;
}
