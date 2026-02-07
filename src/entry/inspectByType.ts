// src/entry/inspectByType.ts
import { PatternType } from "@/config/definePatternConfig";

export async function inspectByType(
  type: PatternType,
  absPath: string,
  ctx: { repoRoot: string; analysisRoot: string; config: any }
) {
  switch (type) {
    case "fsd": {
      const mod = await import("../pattern/fsd/index");
      return mod.inspectFile(absPath, ctx);
    }
    default: {
      const mod = await import("../pattern/fsd/index");
      return mod.inspectFile(absPath, ctx);
    }
  }
}
