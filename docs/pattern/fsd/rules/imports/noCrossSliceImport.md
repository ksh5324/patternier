# src/pattern/fsd/rules/imports/noCrossSliceImport.ts

## 개요
같은 레이어 내 다른 slice로의 직접 import를 금지합니다.

## 입력과 출력
- 입력: 파일 메타, import 목록, 적용 레이어 옵션
- 출력: 진단 배열

## 동작 흐름
- 레이어 필터링(layers 옵션)
- 동일 레이어 + 다른 slice import 감지
- 위반 시 진단 생성

## 확장 포인트
- 특정 slice 예외 처리
