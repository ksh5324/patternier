type Loc = { line: number; col: number } | null;

type SegmentNoUsageContext = {
  file: { relPath: string; layer: string };
};

const RULE_ID = "@patternier/segment-no-usage";

const TARGET_LAYERS = new Set(["features", "pages", "entities", "widgets", "apps"]);
const RESERVED_SEGMENTS = new Set([
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
]);

function hasMissingSegment(relPath: string, layer: string) {
  const parts = relPath.split("/").filter(Boolean);
  if (!layer || !TARGET_LAYERS.has(layer)) return false;

  const segment = parts[2];
  if (!segment) return true;
  if (segment.includes(".")) return true;
  if (!RESERVED_SEGMENTS.has(segment)) return true;

  return false;
}

export function segmentNoUsageRule(ctx: SegmentNoUsageContext) {
  const diags: { ruleId: string; message: string; loc: Loc }[] = [];

  if (!hasMissingSegment(ctx.file.relPath, ctx.file.layer)) return diags;

  diags.push({
    ruleId: RULE_ID,
    message: "slice requires a segment folder: <layer>/<slice>/<segment>/...",
    loc: null,
  });

  return diags;
}
