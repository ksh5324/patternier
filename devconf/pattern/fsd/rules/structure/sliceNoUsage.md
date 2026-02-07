# src/pattern/fsd/rules/structure/sliceNoUsage.ts

## 개요
slice 기반 레이어에서 `<layer>/<slice>/...` 구조를 강제합니다.

## 입력과 출력
- 입력: 파일 경로/레이어, `reservedSegments` 옵션
- 출력: 진단 배열

## 동작 흐름
- 대상 레이어인지 확인
- 두 번째 세그먼트가 없는지/예약어인지 검사
- 위반 시 진단 생성

## 확장 포인트
- 레이어별 예약어 세트 분리
