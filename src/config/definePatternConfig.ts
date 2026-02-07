// src/config/definePatternConfig.ts
import type { FsdRuleSettings } from "@/pattern/fsd/rules";
import type { RuleSetting } from "@/config/rules";

export type PatternType = "fsd"; // 당장은 fsd만

export type LayerConfig = {
  /** Layer order for patterns like FSD. */
  order?: readonly string[];
  /** Layers that must have a slice (e.g., features, entities, widgets). */
  sliceLayers?: readonly string[];
};

type RulesByType<T extends PatternType> = T extends "fsd" ? FsdRuleSettings : Record<string, RuleSetting>;

export type PatternConfig<T extends PatternType = "fsd"> = {
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
  // 나중에 여기에 preset, rules, resolver, ignores... 확장
};

/** Helper for typed config with hover docs. */
export function definePatternConfig<T extends PatternType>(cfg: PatternConfig<T>): PatternConfig<T> {
  return cfg;
}
