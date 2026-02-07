// src/pattern/fsd/inspect.ts
import { getFsMeta } from "./fsMeta";
import { parseFile, type ParsedImport } from "@/core/parse";
import { PatternConfig } from "@/config/definePatternConfig";
import { DEFAULT_FSD_LAYER_ORDER } from "./constants";
import { shouldSkipByLayer } from "./utils/shouldSkipByLayer";
import { normalizeRuleSetting } from "./utils/nomalizeRule";
import { fsdRuleRegistry } from "./rules";
import { resolveImportSource } from "@/utils/resolveImport";

export async function inspectFile(
  absPath: string,
  ctx: { repoRoot: string; analysisRoot: string; config: PatternConfig }
) {
  const userRules = ctx.config.rules ?? {};
  const needs = {
    fetchCalls: false,
    jsx: false,
    template: false,
    useClient: false,
  };

  for (const [ruleId, rule] of Object.entries(fsdRuleRegistry)) {
    const userSettingRaw = (userRules as any)[ruleId];
    const setting = normalizeRuleSetting(userSettingRaw, rule.default);
    if (setting.level === "off") continue;
    if (ruleId === "@patternier/ui-no-side-effects") needs.fetchCalls = true;
    if (ruleId === "@patternier/model-no-presentation") {
      needs.jsx = true;
      needs.template = true;
    }
    if (ruleId === "@patternier/use-client-only-ui") needs.useClient = true;
  }

  const layerOrder = ctx.config.layers?.order ?? DEFAULT_FSD_LAYER_ORDER;
  const sliceLayers = ctx.config.layers?.sliceLayers ?? ["features", "entities", "widgets"];
  const file = getFsMeta(absPath, ctx.analysisRoot, layerOrder, sliceLayers);
  const parsed = await parseFile(absPath, {
    needFetchCalls: needs.fetchCalls,
    needJsx: needs.jsx,
    needTemplateLiterals: needs.template,
    needUseClient: needs.useClient,
  });

  const diagnostics: any[] = [];

  const resolvedImports = await mapLimit(parsed.imports as ParsedImport[], 32, async (im) => {
    const resolvedPath = await resolveImportSource(im.source, absPath, ctx.repoRoot);
    const target = resolvedPath ? getFsMeta(resolvedPath, ctx.analysisRoot, layerOrder, sliceLayers) : null;
    return { ...im, resolvedPath, target };
  });

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
        imports: resolvedImports,
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

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>) {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const current = nextIndex++;
      if (current >= items.length) return;
      results[current] = await fn(items[current]);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}
