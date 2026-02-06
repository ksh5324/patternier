import { noLayerToHigherImportRule } from "./noLayerToHigherImport";
import { noCrossSliceImportRule } from "./noCrossSliceImport";

export const fsdRuleRegistry = {
  "@patternier/no-layer-to-higher-import": {
    run: noLayerToHigherImportRule,
    default: {
        level: "error",
    }
  },
  "@patternier/no-cross-slice-import": {
    run: noCrossSliceImportRule,
    default: {
        level: "error",
        options: { layers: ["features"] }
    }
  }
} as const;