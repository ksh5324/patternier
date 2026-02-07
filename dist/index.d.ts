type RuleLevel = "off" | "warn" | "error";
type RuleSetting = RuleLevel | {
    level?: RuleLevel;
    exclude?: string[];
    include?: string[];
    options?: any;
};

type FsdRuleSettings = Partial<{
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

type PatternType = "fsd";
type LayerConfig = {
    /** Layer order for patterns like FSD. */
    order?: readonly string[];
};
type RulesByType<T extends PatternType> = T extends "fsd" ? FsdRuleSettings : Record<string, RuleSetting[]>;
type PatternConfig<T extends PatternType = "fsd"> = {
    /** Pattern type (currently only "fsd"). */
    type: T;
    /** Root directory to analyze. */
    rootDir?: string;
    /** Layer-level configuration. */
    layers?: LayerConfig;
    /**
     * Rule configuration. Hover rule keys for descriptions.
     */
    rules?: RulesByType<T>;
};
/** Helper for typed config with hover docs. */
declare function definePatternConfig<T extends PatternType>(cfg: PatternConfig<T>): PatternConfig<T>;

export { type PatternConfig, definePatternConfig };
