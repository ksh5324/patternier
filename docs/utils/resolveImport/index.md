# src/utils/resolveImport/index.ts

## 개요
import 소스를 절대 경로로 해석합니다. (상대 경로, tsconfig paths, `@/` alias)

## 입력과 출력
- 입력: `source`, `fromFile`, `repoRoot`
- 출력: 해석된 절대 경로 또는 `null`

## 동작 흐름
- resolve 캐시 확인
- 상대 경로 우선 해석
- tsconfig `baseUrl`/`paths` 적용
- `@/` alias 처리

## 확장 포인트
- tsconfig `extends` 지원
- package.json exports 해석
