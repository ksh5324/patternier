import { noLayerToHigherImportRule } from "./noLayerToHigherImport";
import { noCrossSliceImportRule } from "./noCrossSliceImport";
import { uiNoSideEffectsRule } from "./uiNoSideEffects";
import { sliceNoUsageRule } from "./sliceNoUsage";
import { modelNoPresentationRule } from "./modelNoPresentation";
import { useClientOnlyUiRule } from "./useClientOnlyUi";
import { noDeepImportRule } from "./noDeepImport";
import type { RuleSetting } from "@/config/rules";

export type FsdRuleSettings = Partial<{
  /** Prevent importing higher-level layers from lower-level ones. */
  "@patternier/no-layer-to-higher-import": RuleSetting;
  /** Block cross-slice imports within the same layer (default: features). */
  "@patternier/no-cross-slice-import": RuleSetting;
  /** Disallow side-effects (fetch/axios) inside ui paths. */
  "@patternier/ui-no-side-effects": RuleSetting;
  /** Enforce <layer>/<slice>/... structure for slice-based layers. */
  "@patternier/slice-no-usage": RuleSetting;
  /** Disallow JSX/template literals inside model paths (opt-in). */
  "@patternier/model-no-presentation": RuleSetting;
  /** Allow "use client" only under ui paths. Options: { allow?: string[]; exclude?: string[] } */
  "@patternier/use-client-only-ui": RuleSetting;
  /** Disallow deep imports beyond maxDepth (default: 3). */
  "@patternier/no-deep-import": RuleSetting;
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
  }
}
