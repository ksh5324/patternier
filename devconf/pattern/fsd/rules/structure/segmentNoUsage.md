# src/pattern/fsd/rules/structure/segmentNoUsage.ts

## 개요
slice 아래에 `<segment>` 폴더가 반드시 오도록 강제합니다.

## 입력과 출력
- 입력: 파일 경로/레이어, `segments` 옵션
- 출력: 진단 배열

## 동작 흐름
- 대상 레이어인지 확인
- 세 번째 세그먼트 존재/허용 여부 검사
- 위반 시 진단 생성

## 확장 포인트
- 레이어별 허용 세그먼트 분리
