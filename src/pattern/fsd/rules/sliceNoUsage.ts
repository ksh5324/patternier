type Loc = { line: number; col: number } | null;

type SliceNoUsageContext = {
  file: { relPath: string; layer: string };
};

const RULE_ID = "@patternier/slice-no-usage";

const TARGET_LAYERS = new Set(["features", "pages", "entities", "widgets", "apps"]);
const RESERVED_SEGMENTS = new Set([
  "ui",
  "model",
  "lib",
  "utils",
  "config",
  "types",
  "constants",
  "assets",
  "styles",
  "hooks",
]);

function hasMissingSlice(relPath: string, layer: string) {
  const parts = relPath.split("/").filter(Boolean);
  if (!layer || !TARGET_LAYERS.has(layer)) return false;

  const second = parts[1];
  if (!second) return true;
  if (second.includes(".")) return true;
  if (RESERVED_SEGMENTS.has(second)) return true;

  return false;
}

export function sliceNoUsageRule(ctx: SliceNoUsageContext) {
  const diags: { ruleId: string; message: string; loc: Loc }[] = [];

  if (!hasMissingSlice(ctx.file.relPath, ctx.file.layer)) return diags;

  diags.push({
    ruleId: RULE_ID,
    message: "layer requires a slice folder: <layer>/<slice>/...",
    loc: null,
  });

  return diags;
}
