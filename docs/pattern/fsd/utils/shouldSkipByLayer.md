# src/pattern/fsd/utils/shouldSkipByLayer.ts

## 개요
룰의 include/exclude 설정을 레이어 기준으로 적용합니다.

## 입력과 출력
- 입력: 파일 레이어, 정규화된 룰 설정
- 출력: boolean (skip 여부)

## 동작 흐름
- include가 있으면 포함되지 않는 레이어를 스킵
- exclude가 있으면 해당 레이어를 스킵

## 확장 포인트
- 슬라이스/세그먼트 기준 필터링
