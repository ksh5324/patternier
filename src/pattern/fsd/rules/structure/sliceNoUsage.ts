import type { Loc } from "../types";

type SliceNoUsageContext = {
  file: { relPath: string; layer: string };
};

type SliceNoUsageOptions = {
  reservedSegments?: string[];
  targetLayers?: string[];
};

const RULE_ID = "@patternier/slice-no-usage";

const DEFAULT_TARGET_LAYERS = ["features", "pages", "entities", "widgets", "apps"];
const DEFAULT_RESERVED_SEGMENTS = [
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
];

function hasMissingSlice(
  relPath: string,
  layer: string,
  reservedSegments: Set<string>,
  targetLayers: Set<string>
) {
  const parts = relPath.split("/").filter(Boolean);
  if (!layer || !targetLayers.has(layer)) return false;

  const second = parts[1];
  if (!second) return true;
  if (second.includes(".")) return true;
  if (reservedSegments.has(second)) return true;

  return false;
}

export function sliceNoUsageRule(ctx: SliceNoUsageContext, opts?: SliceNoUsageOptions) {
  const diags: { ruleId: string; message: string; loc: Loc }[] = [];
  const reserved = new Set([
    ...DEFAULT_RESERVED_SEGMENTS,
    ...(opts?.reservedSegments ?? []),
  ]);
  const targetLayers = new Set(opts?.targetLayers ?? DEFAULT_TARGET_LAYERS);

  if (!hasMissingSlice(ctx.file.relPath, ctx.file.layer, reserved, targetLayers)) return diags;

  diags.push({
    ruleId: RULE_ID,
    message: "layer requires a slice folder: <layer>/<slice>/...",
    loc: null,
  });

  return diags;
}
