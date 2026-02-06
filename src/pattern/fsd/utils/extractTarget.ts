// src/pattern/fsd/utils/extractTarget.ts
export type LayerName = "app" | "pages" | "widgets" | "features" | "entities" | "shared" | string;

const LAYERS: LayerName[] = ["app", "pages", "widgets", "features", "entities", "shared"];

export function extractTargetFromSource(source: string): { layer: LayerName; slice: string | null } | null {
  // 허용 케이스:
  // "@/features/auth/..." or "features/auth/..."
  const normalized = source.startsWith("@/") ? source.slice(2) : source;

  const parts = normalized.split("/").filter(Boolean);
  const layer = parts[0] as LayerName | undefined;

  if (!layer || !LAYERS.includes(layer)) return null;

  const slice = (layer === "features" || layer === "entities" || layer === "widgets") && parts.length >= 2
    ? parts[1]
    : null;

  return { layer, slice };
}

export function getLayerIndex(layer: LayerName, order: readonly LayerName[]) {
  return order.indexOf(layer);
}
