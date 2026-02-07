# src/pattern/fsd/rules/imports/noDeepImport.ts

## 개요
지정된 깊이 이상의 import 경로를 금지합니다.

## 입력과 출력
- 입력: import 목록, `maxDepth` 옵션
- 출력: 진단 배열

## 동작 흐름
- 상대 경로는 제외
- 경로 세그먼트 개수를 계산
- `maxDepth` 초과 시 진단 생성

## 확장 포인트
- resolver 기반 깊이 계산
- 레이어별 깊이 정책
