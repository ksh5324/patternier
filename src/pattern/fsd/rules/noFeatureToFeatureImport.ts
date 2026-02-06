// src/pattern/fsd/rules/noFeatureToFeatureImport.ts
import path from "node:path";

function isFeaturePath(p: string) {
  // relPath 기준 "features/<slice>/..."
  return p.startsWith("features/");
}

function getSlice(relPath: string) {
  const parts = relPath.split("/");
  return parts[0] === "features" && parts.length >= 2 ? parts[1] : null;
}

export function noFeatureToFeatureImportRule(ctx: {
  fileRelPath: string;
  imports: { source: string | null; loc?: any }[];
}) {
  const diags: any[] = [];

  if (!isFeaturePath(ctx.fileRelPath)) return diags;

  const fromSlice = getSlice(ctx.fileRelPath);

  for (const im of ctx.imports) {
    const src = im.source;
    if (!src) continue;

    // 상대경로로 feature를 타는 경우는 resolver 붙기 전이라 판단 어려움
    // MVP에서는 "@/features/..." 같은 alias 기반만 먼저 잡자
    if (src.startsWith("@/features/") || src.startsWith("features/")) {
      const toSlice = src.replace(/^@?\//, "").split("/")[1] ?? null;

      if (fromSlice && toSlice && fromSlice !== toSlice) {
        diags.push({
          ruleId: "fsd/no-feature-to-feature-import",
          message: `features/${fromSlice} cannot import from features/${toSlice}. Use shared/entities or expose via public API.`,
          loc: im.loc ?? null,
        });
      }
    }
  }

  return diags;
}
