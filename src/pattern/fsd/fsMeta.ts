// src/inspect/fsMeta.ts
import path from "node:path";

const FSD_LAYERS = ["app", "apps", "pages", "widgets", "features", "entities", "shared"] as const;

export function getFsMeta(absPath: string, repoRoot: string) {
  const relPath = path.relative(repoRoot, absPath).replaceAll(path.sep, "/");
  const parts = relPath.split("/");

  const layer = (FSD_LAYERS as readonly string[]).includes(parts[0] ?? "")
    ? (parts[0] as (typeof FSD_LAYERS)[number])
    : "unknown";

  // slice: features/<slice>/..., entities/<slice>/...
  const slice =
    (layer === "features" || layer === "entities" || layer === "widgets") && parts.length >= 2
      ? parts[1]
      : null;

  return {
    absPath,
    relPath,
    layer,
    slice,
  };
}
