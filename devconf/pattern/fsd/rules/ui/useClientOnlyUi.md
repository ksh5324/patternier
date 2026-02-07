# src/pattern/fsd/rules/ui/useClientOnlyUi.ts

## 개요
`"use client"`는 기본적으로 `ui` 경로에서만 허용합니다.

## 입력과 출력
- 입력: 파일 경로, `useClient` 여부, allow/exclude 옵션
- 출력: 진단 배열

## 동작 흐름
- `use client`가 없으면 스킵
- allow 패턴에 포함되면 통과
- exclude 패턴이면 스킵
- 나머지는 진단 생성

## 확장 포인트
- 레이어별 허용 경로 정책
