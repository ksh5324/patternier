# src/pattern/fsd/utils/nomalizeRule.ts

## 개요
룰 설정을 표준 형태로 정규화합니다.

## 입력과 출력
- 입력: 사용자 설정, 기본 설정
- 출력: `NormalizedRuleSetting`

## 동작 흐름
- 문자열 레벨이면 기본 옵션을 병합
- 객체면 level/include/exclude/options를 병합
- 설정이 없으면 기본값 반환

## 확장 포인트
- 옵션 스키마 검증
- 경고 메시지 강화
