import type { Loc } from "../types";

type UiNoSideEffectsContext = {
  file: { relPath: string };
  imports: { source: string | null; loc?: Loc }[];
  fetchCalls?: { loc: Loc }[];
};

const RULE_ID = "@patternier/ui-no-side-effects";

function isUiFile(relPath: string) {
  return relPath.split("/").includes("ui");
}

export function uiNoSideEffectsRule(ctx: UiNoSideEffectsContext) {
  const diags: { ruleId: string; message: string; loc: Loc }[] = [];

  if (!isUiFile(ctx.file.relPath)) return diags;

  for (const fc of ctx.fetchCalls ?? []) {
    diags.push({
      ruleId: RULE_ID,
      message: "ui cannot use fetch/axios. Move side-effects to api/model layer.",
      loc: fc.loc ?? null,
    });
  }

  return diags;
}
