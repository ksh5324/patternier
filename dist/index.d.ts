type PatternType = "fsd";
type LayerConfig = {
    order?: readonly string[];
};
type PatternConfig = {
    type: PatternType;
    rootDir?: string;
    layers?: LayerConfig;
    rules?: {
        [ruleId: string]: "off" | "warn" | "error" | {
            level?: "off" | "warn" | "error";
            exclude?: string[];
            include?: string[];
            options?: any;
        };
    };
};
declare function definePatternConfig<T extends PatternConfig>(cfg: T): T;

export { type PatternConfig, definePatternConfig };
