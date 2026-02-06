// src/config/definePatternConfig.ts
export type PatternType = "fsd"; // 당장은 fsd만

export type LayerConfig = {
  order?: readonly string[];
};


export type PatternConfig = {
  type: PatternType;
  rootDir?: string;
  layers?: LayerConfig;

  rules?: {
    [ruleId: string]:
      | "off"
      | "warn"
      | "error"
      | { level?: "off" | "warn" | "error"; exclude?: string[]; include?: string[]; options?: any }
  }
  // 나중에 여기에 preset, rules, resolver, ignores... 확장
};

export function definePatternConfig<T extends PatternConfig>(cfg: T): T {
  return cfg;
}
