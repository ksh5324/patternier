type Level = "off" | "warn" | "error";

export type NormalizedRuleSetting = {
  level: Level;
  include?: string[];
  exclude?: string[];
  options?: any;
};

export function normalizeRuleSetting(x: any, defaultSetting: NormalizedRuleSetting): NormalizedRuleSetting {
  if (x === "off" || x === "warn" || x === "error") 
    return { 
      level: x, 
      include: defaultSetting.include, 
      exclude: defaultSetting.exclude, 
      options: defaultSetting.options 
    };
  if (x && typeof x === "object") {
    return {
      level: (x.level ?? defaultSetting.level) as Level,
      include: x.include ?? defaultSetting.include,
      exclude: x.exclude ?? defaultSetting.exclude,
      options: x.options ?? defaultSetting.options,
    };
  }

  return defaultSetting;
}
