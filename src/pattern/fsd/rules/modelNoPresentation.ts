type Loc = { line: number; col: number } | null;

type ModelNoPresentationContext = {
  file: { relPath: string };
  parsed?: {
    jsxUsages?: { loc: Loc }[];
    templateLiterals?: { loc: Loc }[];
  };
};

const RULE_ID = "@patternier/model-no-presentation";

function isModelPath(relPath: string) {
  return relPath.split("/").includes("model");
}

export function modelNoPresentationRule(ctx: ModelNoPresentationContext) {
  const diags: { ruleId: string; message: string; loc: Loc }[] = [];

  if (!isModelPath(ctx.file.relPath)) return diags;

  const jsxLocs = ctx.parsed?.jsxUsages ?? [];
  const tmplLocs = ctx.parsed?.templateLiterals ?? [];

  for (const j of jsxLocs) {
    diags.push({
      ruleId: RULE_ID,
      message: "model cannot use JSX. Keep model layer pure.",
      loc: j.loc ?? null,
    });
  }

  for (const t of tmplLocs) {
    diags.push({
      ruleId: RULE_ID,
      message: "model cannot use template literals. Keep model layer pure.",
      loc: t.loc ?? null,
    });
  }

  return diags;
}
