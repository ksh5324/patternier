import type { Loc } from "../types";

type NoDeepImportContext = {
  file: { relPath: string };
  imports: { source: string | null; loc?: Loc }[];
};

type NoDeepImportOptions = {
  maxDepth?: number;
};

const RULE_ID = "@patternier/no-deep-import";

function getImportDepth(src: string) {
  const normalized = src.startsWith("@/") ? src.slice(2) : src;
  const parts = normalized.split("/").filter(Boolean);
  return parts.length;
}

export function noDeepImportRule(ctx: NoDeepImportContext, opts?: NoDeepImportOptions) {
  const diags: { ruleId: string; message: string; loc: Loc }[] = [];
  const maxDepth = opts?.maxDepth ?? 3;

  for (const im of ctx.imports) {
    const src = im.source;
    if (!src) continue;
    if (src.startsWith(".")) continue;

    const depth = getImportDepth(src);
    if (depth > maxDepth) {
      diags.push({
        ruleId: RULE_ID,
        message: `deep import is not allowed. Max depth is ${maxDepth}.`,
        loc: im.loc ?? null,
      });
    }
  }

  return diags;
}
