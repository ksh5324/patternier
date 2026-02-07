import type { Loc } from "../types";

type SegmentNoUsageContext = {
  file: { relPath: string; layer: string };
};

type SegmentNoUsageOptions = {
  segments?: string[];
  targetLayers?: string[];
};

const RULE_ID = "@patternier/segment-no-usage";

const DEFAULT_TARGET_LAYERS = ["features", "pages", "entities", "widgets", "apps"];
const DEFAULT_SEGMENTS = [
  "ui",
  "model",
  "lib",
  "utils",
  "util",
  "helpers",
  "helper",
  "config",
  "configs",
  "types",
  "type",
  "constants",
  "constant",
  "assets",
  "asset",
  "styles",
  "style",
  "hooks",
  "hook",
  "api",
  "apis",
  "service",
  "services",
  "client",
  "clients",
  "repository",
  "repositories",
  "store",
  "stores",
  "state",
  "states",
  "schema",
  "schemas",
  "dto",
  "dtos",
  "query",
  "queries",
  "mutation",
  "mutations",
  "adapter",
  "adapters",
  "components",
  "component",
  "view",
  "views",
  "layout",
  "layouts",
  "presentation",
  "presenter",
  "render",
  "renders",
  "env",
  "runtime",
  "platform",
  "infra",
  "infrastructure",
  "server",
  "client-side",
  "shared-client",
  "shared-server",
  "tests",
  "test",
  "__tests__",
  "mocks",
  "__mocks__",
  "fixtures",
  "__fixtures__",
  "stories",
  "__stories__",
  "storybook",
  "example",
  "examples",
  "demo",
  "demos",
  "docs",
  "doc",
  "scripts",
  "tools",
  "tooling",
  "generators",
  "templates",
  "dist",
  "build",
  "out",
  "coverage",
  "public",
  "static",
  "vendor",
  "generated",
  "__generated__",
];

function hasMissingSegment(
  relPath: string,
  layer: string,
  segments: Set<string>,
  targetLayers: Set<string>
) {
  const parts = relPath.split("/").filter(Boolean);
  if (!layer || !targetLayers.has(layer)) return false;

  const segment = parts[2];
  if (!segment) return true;
  if (segment.includes(".")) return true;
  if (!segments.has(segment)) return true;

  return false;
}

export function segmentNoUsageRule(ctx: SegmentNoUsageContext, opts?: SegmentNoUsageOptions) {
  const diags: { ruleId: string; message: string; loc: Loc }[] = [];
  const segments = new Set([
    ...DEFAULT_SEGMENTS,
    ...(opts?.segments ?? []),
  ]);
  const targetLayers = new Set(opts?.targetLayers ?? DEFAULT_TARGET_LAYERS);

  if (!hasMissingSegment(ctx.file.relPath, ctx.file.layer, segments, targetLayers)) return diags;

  diags.push({
    ruleId: RULE_ID,
    message: "slice requires a segment folder: <layer>/<slice>/<segment>/...",
    loc: null,
  });

  return diags;
}
