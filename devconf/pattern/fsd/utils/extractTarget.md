# src/pattern/fsd/utils/extractTarget.ts

## 개요
import source 문자열에서 레이어/슬라이스 타겟을 추출합니다.

## 입력과 출력
- 입력: import source 문자열
- 출력: `{ layer, slice }` 또는 `null`

## 동작 흐름
- `@/` prefix 제거
- 첫 세그먼트가 레이어인지 확인
- slice 가능한 레이어면 두 번째 세그먼트 반환

## 확장 포인트
- 커스텀 alias 지원
- 레이어 목록 확장
