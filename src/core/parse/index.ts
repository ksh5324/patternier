import fs from "node:fs/promises";
import path from "node:path";
import * as swc from "@swc/core";
import { makeOffsetToLoc } from "@/utils/makeOffsetToLoc";
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
  const syntax = ext === ".ts" || ext === ".tsx" ? "typescript" : "ecmascript";
  const tsx = ext === ".tsx" || ext === ".jsx";

  const ast = await swc.parse(code, {
    syntax,
    tsx,
    decorators: true,
    dynamicImport: true,
  } as any);

  const baseOffset = (ast as any).span?.start ?? 1;
  const result = collectFromAst(ast, offsetToLoc, baseOffset, opts);

  parseCache.set(cacheKey, { mtimeMs: st.mtimeMs, key: optionKey, result });
  return result;
}

export { parseFile };
