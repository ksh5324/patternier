import type { Loc, ParsedImport, ParsedResult, ParseOptions } from "./types";
import { locFromSpan } from "./loc";

function collectFromAst(
  ast: any,
  offsetToLoc: (n: number) => Loc,
  baseOffset: number,
  opts?: ParseOptions
): ParsedResult {
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
          type: s.type,
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

  return {
    imports,
    exports,
    requires,
    dynamicImports,
    fetchCalls,
    jsxUsages,
    templateLiterals,
    directives: { useClient },
  };
}

export { collectFromAst };
