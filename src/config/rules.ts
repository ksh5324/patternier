export type RuleLevel = "off" | "warn" | "error";

export type RuleSetting =
  | RuleLevel
  | {
      level?: RuleLevel;
      exclude?: string[];
      include?: string[];
      options?: any;
    };
