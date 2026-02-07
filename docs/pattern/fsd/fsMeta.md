# src/pattern/fsd/fsMeta.ts

## 개요
경로를 기반으로 FSD 레이어/슬라이스 메타 정보를 계산합니다.

## 입력과 출력
- 입력: 절대 경로, analysisRoot
- 출력: `{ relPath, layer, slice }`

## 동작 흐름
- analysisRoot 기준 상대 경로 계산
- 첫 세그먼트로 레이어 판별
- features/entities/widgets는 두 번째 세그먼트를 slice로 사용

## 확장 포인트
- 사용자 정의 레이어 지원
- slice 판별 규칙 확장
