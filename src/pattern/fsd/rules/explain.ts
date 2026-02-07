export const fsdRuleExplain: Record<string, string> = {
  "@patternier/no-layer-to-higher-import":
    "하위 레이어가 상위 레이어에 의존하면 아키텍처 방향성이 깨지고 변경 영향 범위가 커집니다.",
  "@patternier/no-cross-slice-import":
    "같은 레이어의 다른 slice로 직접 접근하면 경계가 무너지고 결합도가 높아집니다.",
  "@patternier/ui-no-side-effects":
    "UI는 표현 계층이므로 데이터 로딩/요청 같은 side-effect를 가지면 테스트와 재사용성이 떨어집니다.",
  "@patternier/slice-no-usage":
    "slice 없이 레이어에 바로 파일을 두면 경계가 모호해지고 구조가 쉽게 붕괴됩니다.",
  "@patternier/segment-no-usage":
    "slice 아래에 segment를 두지 않으면 책임이 섞여 유지보수가 어려워집니다.",
  "@patternier/model-no-presentation":
    "model은 순수 상태/도메인 로직이어야 하므로 표현(JSX, 템플릿)을 포함하면 책임이 섞입니다.",
  "@patternier/use-client-only-ui":
    "\"use client\"는 UI 영역으로 제한해 클라이언트/서버 경계를 명확히 유지해야 합니다.",
  "@patternier/no-deep-import":
    "깊은 경로 import는 내부 구조 의존을 고착화해 리팩토링 비용을 증가시킵니다.",
};
