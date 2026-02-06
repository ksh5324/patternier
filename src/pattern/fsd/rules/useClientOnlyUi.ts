import picomatch from "picomatch";

type Loc = { line: number; col: number } | null;

type UseClientOnlyUiContext = {
  file: { relPath: string };
  parsed?: { directives?: { useClient?: boolean } };
};

type UseClientOnlyUiOptions = {
  exclude?: string[];
  allow?: string[] | string;
};

const RULE_ID = "@patternier/use-client-only-ui";
const DEFAULT_ALLOW = ["**/ui/**"];

function matches(patterns: string[] | undefined, relPath: string) {
  if (!patterns || patterns.length === 0) return false;
  return picomatch(patterns)(relPath);
}

export function useClientOnlyUiRule(ctx: UseClientOnlyUiContext, opts?: UseClientOnlyUiOptions) {
  const diags: { ruleId: string; message: string; loc: Loc }[] = [];

  if (!ctx.parsed?.directives?.useClient) return diags;

  const relPath = ctx.file.relPath;
  const allow = Array.isArray(opts?.allow) ? opts?.allow : opts?.allow ? [opts.allow] : DEFAULT_ALLOW;

  if (matches(opts?.exclude, relPath)) return diags;
  if (matches(allow, relPath)) return diags;

  diags.push({
    ruleId: RULE_ID,
    message: '"use client" is only allowed under ui paths.',
    loc: null,
  });

  return diags;
}
