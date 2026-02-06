import { NormalizedRuleSetting } from "./nomalizeRule";

function shouldSkipByLayer(fileLayer: string, setting: NormalizedRuleSetting) {
    if (setting.include?.length) return !setting.include.includes(fileLayer);
    if (setting.exclude?.length) return setting.exclude.includes(fileLayer);
    return false;
  }

export { shouldSkipByLayer };