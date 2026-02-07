import { noLayerToHigherImportRule } from "./imports/noLayerToHigherImport";
import { noCrossSliceImportRule } from "./imports/noCrossSliceImport";
import { noDeepImportRule } from "./imports/noDeepImport";
import { sliceNoUsageRule } from "./structure/sliceNoUsage";
import { segmentNoUsageRule } from "./structure/segmentNoUsage";
import { uiNoSideEffectsRule } from "./ui/uiNoSideEffects";
import { useClientOnlyUiRule } from "./ui/useClientOnlyUi";
import { modelNoPresentationRule } from "./model/modelNoPresentation";
import type { RuleSetting } from "@/config/rules";

export type FsdRuleSettings = Partial<{
  /** Prevent importing higher-level layers from lower-level ones. */
  "@patternier/no-layer-to-higher-import": RuleSetting;
  /** Block cross-slice imports within the same layer (default: features). */
  "@patternier/no-cross-slice-import": RuleSetting;
  /** Disallow side-effects (fetch/axios) inside ui paths. */
  "@patternier/ui-no-side-effects": RuleSetting;
  /** Enforce <layer>/<slice>/... structure for slice-based layers. Options: { reservedSegments?: string[] } */
  "@patternier/slice-no-usage": RuleSetting;
  /** Disallow JSX/template literals inside model paths (opt-in). */
  "@patternier/model-no-presentation": RuleSetting;
  /** Allow "use client" only under ui paths. Options: { allow?: string[]; exclude?: string[] } */
  "@patternier/use-client-only-ui": RuleSetting;
  /** Disallow deep imports beyond maxDepth (default: 3). */
  "@patternier/no-deep-import": RuleSetting;
  /** Enforce <layer>/<slice>/<segment>/... structure for slice-based layers. Options: { segments?: string[] } */
  "@patternier/segment-no-usage": RuleSetting;
}>;

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
  },
  "@patternier/model-no-presentation": {
    run: modelNoPresentationRule,
    default: {
        level: "off",
    }
  },
  "@patternier/use-client-only-ui": {
    run: useClientOnlyUiRule,
    default: {
        level: "off",
        options: { allow: ["**/ui/**"] }
    }
  },
  "@patternier/no-deep-import": {
    run: noDeepImportRule,
    default: {
        level: "off",
        options: { maxDepth: 3 }
    }
  },
  "@patternier/segment-no-usage": {
    run: segmentNoUsageRule,
    default: {
        level: "error",
        exclude: ["shared"]
    }
  }
}
