// src/pattern/fsd/parse.ts
import fs from "node:fs/promises";
import path from "node:path";
import * as swc from "@swc/core";
import { makeOffsetToLoc } from "@/utils/makeOffsetToLoc";

function locFromSpan(
  span: any,
  offsetToLoc: (n: number) => { line: number; col: number },
  baseOffset: number
) {
  if (!span || typeof span.start !== "number") return null;
  const relOffset = span.start - baseOffset + 1;
  return offsetToLoc(relOffset > 0 ? relOffset : span.start);
}

export async function parseFile(absPath: string) {
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

  const imports: any[] = [];
  const exports: any[] = [];
  const requires: any[] = [];
  const dynamicImports: any[] = [];
  let useClient = false;

  for (const stmt of (ast as any).body ?? []) {
    if (
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

  return {
    imports,
    exports,
    requires,
    dynamicImports,
    directives: { useClient },
  };
}
