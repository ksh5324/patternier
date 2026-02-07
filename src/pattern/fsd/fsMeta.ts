// src/inspect/fsMeta.ts
import path from "node:path";

const DEFAULT_LAYERS = ["app", "apps", "pages", "widgets", "features", "entities", "shared"] as const;
const DEFAULT_SLICE_LAYERS = ["features", "entities", "widgets"] as const;

export function getFsMeta(
  absPath: string,
  repoRoot: string,
  layers: readonly string[] = DEFAULT_LAYERS,
  sliceLayers: readonly string[] = DEFAULT_SLICE_LAYERS
) {
  const relPath = path.relative(repoRoot, absPath).replaceAll(path.sep, "/");
  const parts = relPath.split("/");

  const layer = (layers as readonly string[]).includes(parts[0] ?? "")
    ? (parts[0] as string)
    : "unknown";

  // slice: features/<slice>/..., entities/<slice>/...
  const slice =
    sliceLayers.includes(layer) && parts.length >= 2
      ? parts[1]
      : null;

  return {
    absPath,
    relPath,
    layer,
    slice,
  };
}
