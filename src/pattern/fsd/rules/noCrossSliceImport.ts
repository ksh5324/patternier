// src/pattern/fsd/rules/noCrossSliceImport.ts
import { extractTargetFromSource } from "../utils/extractTarget";

type Loc = { line: number; col: number } | null;

export type Diagnostic = {
  ruleId: string;
  message: string;
  loc: Loc;
};

export type NoCrossSliceImportOptions = {
  // 기본: features만 강제
  layers: readonly string[];
};

export function noCrossSliceImportRule(
  ctx: {
    file: { relPath: string; layer: string; slice: string | null };
    imports: { source: string | null; loc: Loc }[];
  },
  opts: NoCrossSliceImportOptions
): Diagnostic[] {
  const diags: Diagnostic[] = [];

  const fromLayer = ctx.file.layer;
  const fromSlice = ctx.file.slice;

  if (!opts.layers.includes(fromLayer)) return diags;
  if (!fromSlice) return diags;

  for (const im of ctx.imports) {
    const src = im.source;
    if (!src) continue;

    const target = extractTargetFromSource(src);
    if (!target) continue;

    // 같은 layer 내에서 slice가 다른 곳으로 가는 것만 금지
    if (target.layer === fromLayer) {
      const toSlice = target.slice;
      if (toSlice && toSlice !== fromSlice) {
        diags.push({
          ruleId: "@patternier/no-cross-slice-import",
          message: `${fromLayer}/${fromSlice} cannot import from ${fromLayer}/${toSlice}. Use shared/entities or expose via public API.`,
          loc: im.loc ?? null,
        });
      }
    }
  }

  return diags;
}
