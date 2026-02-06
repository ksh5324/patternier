// src/pattern/fsd/inspect.ts
import { getFsMeta } from "./fsMeta";
import { parseFile } from "@/core/parse";
import { PatternConfig } from "@/config/definePatternConfig";
import { DEFAULT_FSD_LAYER_ORDER } from "./constants";
import { shouldSkipByLayer } from "./utils/shouldSkipByLayer";
import { normalizeRuleSetting } from "./utils/nomalizeRule";
import { fsdRuleRegistry } from "./rules";

export async function inspectFile(absPath: string, ctx: { analysisRoot: string; config: PatternConfig }) {
  const file = getFsMeta(absPath, ctx.analysisRoot);
  const parsed = await parseFile(absPath);

  // 룰 옵션에 들어갈 공통 컨텍스트(예: layer order)
  const layerOrder = ctx.config.layers?.order ?? DEFAULT_FSD_LAYER_ORDER;

  const diagnostics: any[] = [];

  const userRules = ctx.config.rules ?? {};

  for (const [ruleId, rule] of Object.entries(fsdRuleRegistry)) {
    // 1) 사용자 설정 가져오기 (없으면 default)
    const userSettingRaw = (userRules as any)[ruleId];
    const setting = normalizeRuleSetting(userSettingRaw, rule.default);

    // 2) off면 스킵
    if (setting.level === "off") continue;

    // 3) include/exclude(layer 기준) 적용
    if (shouldSkipByLayer(file.layer, setting)) continue;

    // 4) rule options 구성 (공통 + 유저)

    const options = {
      // 공통 옵션들
      order: layerOrder,
      // 유저가 rule별로 넣은 options
      ...(setting.options ?? {}),
    };

    // 5) 실행
    const diags = rule.run(
      {
        file,
        imports: parsed.imports,
        fetchCalls: parsed.fetchCalls,
        parsed,
      },
      options
    );

    // 6) level 주입
    for (const d of diags) {
      diagnostics.push({ ...d, level: setting.level });
    }
  }

  return { file, ...parsed, diagnostics };
}
