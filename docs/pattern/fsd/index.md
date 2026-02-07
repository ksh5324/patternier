# src/pattern/fsd/index.ts

## 개요
FSD 패턴 엔트리 포인트입니다. FSD 검사 함수(`inspectFile`)를 외부에서 사용할 수 있게 export 합니다.

## 입력과 출력
- 입력: 없음 (re-export)
- 출력: `inspectFile` 함수

## 동작 흐름
- `inspect.ts`의 `inspectFile`을 그대로 re-export

## 확장 포인트
- FSD 전용 공개 API 추가
