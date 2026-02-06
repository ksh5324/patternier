import { noLayerToHigherImportRule } from "./noLayerToHigherImport";
import { noCrossSliceImportRule } from "./noCrossSliceImport";
import { uiNoSideEffectsRule } from "./uiNoSideEffects";
import { sliceNoUsageRule } from "./sliceNoUsage";

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
  },
  "@patternier/ui-no-side-effects": {
    run: uiNoSideEffectsRule,
    default: {
        level: "error",
    }
  },
  "@patternier/slice-no-usage": {
    run: sliceNoUsageRule,
    default: {
        level: "error",
        exclude: ["shared"]
    }
  }
} as const;
