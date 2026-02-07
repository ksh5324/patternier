# src/utils/resolveImport/cache.ts

## 개요
tsconfig 및 import 해석 결과를 메모리에 캐시합니다.

## 입력과 출력
- 입력: `repoRoot`, `fromFile::source`
- 출력: 캐시된 tsconfig 또는 해석 결과

## 동작 흐름
- `tsconfigCache`: repo root 기준
- `resolveCache`: 파일+소스 기준

## 확장 포인트
- 캐시 무효화/용량 제한
