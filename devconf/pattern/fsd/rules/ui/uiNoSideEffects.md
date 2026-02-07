# src/pattern/fsd/rules/ui/uiNoSideEffects.ts

## 개요
`ui` 경로에서 side-effect(fetch/axios) 사용을 금지합니다.

## 입력과 출력
- 입력: 파일 경로, fetchCalls
- 출력: 진단 배열

## 동작 흐름
- `ui` 경로인지 확인
- `fetchCalls`가 있으면 진단 생성

## 확장 포인트
- axios/HTTP 클라이언트 구분 출력
- 특정 UI 하위 폴더 예외
