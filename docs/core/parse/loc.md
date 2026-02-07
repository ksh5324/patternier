# src/core/parse/loc.ts

## 개요
SWC span offset을 `{line, col}`로 변환합니다.

## 입력과 출력
- 입력: span, `offsetToLoc`, base offset
- 출력: `Loc | null`

## 동작 흐름
- span start를 base offset 기준으로 정규화
- `offsetToLoc`로 라인/컬럼 계산

## 확장 포인트
- SWC span 정책 변화 대응
