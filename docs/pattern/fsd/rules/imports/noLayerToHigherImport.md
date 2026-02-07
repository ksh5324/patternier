# src/pattern/fsd/rules/imports/noLayerToHigherImport.ts

## 개요
하위 레이어에서 상위 레이어로의 import를 금지합니다.

## 입력과 출력
- 입력: 파일 메타, import 목록, 레이어 순서 옵션
- 출력: 진단 배열

## 동작 흐름
- 현재 파일 레이어의 인덱스 계산
- 각 import의 target 레이어와 비교
- 상위 레이어로 향하면 진단 생성

## 확장 포인트
- 특정 레이어 예외 허용
