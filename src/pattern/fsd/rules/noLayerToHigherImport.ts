// src/pattern/fsd/rules/noLayerToHigherImport.ts
import type { LayerName } from "../utils/extractTarget";
import { extractTargetFromSource, getLayerIndex } from "../utils/extractTarget";

type Loc = { line: number; col: number } | null;

export type Diagnostic = {
  ruleId: string;
  message: string;
  loc: Loc;
};

export type NoLayerToHigherImportOptions = {
  // 상위 -> 하위 방향을 허용하는 "정렬"
  // app(가장 상위) ... shared(가장 하위)
  order: readonly LayerName[];
};

export function noLayerToHigherImportRule(
  ctx: {
    file: { relPath: string; layer: string; slice: string | null };
    imports: { source: string | null; loc: Loc }[];
  },
  opts: NoLayerToHigherImportOptions
): Diagnostic[] {
  const diags: Diagnostic[] = [];

  const fromLayer = ctx.file.layer as LayerName;
  const fromIdx = getLayerIndex(fromLayer, opts.order);
  if (fromIdx === -1) return diags; // unknown layer면 패스

  for (const im of ctx.imports) {
    const src = im.source;
    if (!src) continue;

    const target = extractTargetFromSource(src);
    if (!target) continue;

    const toIdx = getLayerIndex(target.layer, opts.order);
    if (toIdx === -1) continue;

    // "higher"는 index가 더 작은 쪽(app이 0)
    const isImportingHigher = toIdx < fromIdx;

    if (isImportingHigher) {
      diags.push({
        ruleId: "@patternier/no-layer-to-higher-import",
        message: `${fromLayer} cannot import from higher layer ${target.layer}.`,
        loc: im.loc ?? null,
      });
    }
  }

  return diags;
}
