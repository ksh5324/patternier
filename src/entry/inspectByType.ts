// src/entry/inspectByType.ts
import { PatternType } from "@/config/definePatternConfig";
import {inspectFile as inspectFsd} from "../pattern/fsd/inspect";

export async function inspectByType(
  type: PatternType,
  absPath: string,
  ctx: { repoRoot: string; analysisRoot: string; config: any }
) {
  switch (type) {
    case "fsd":
      return inspectFsd(absPath, ctx);
    default: return inspectFsd(absPath, ctx);
  }
}
