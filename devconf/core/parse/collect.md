# src/core/parse/collect.ts

## 개요
SWC AST를 순회하며 import, directive, 사용 시그널(fetch/JSX/template)을 수집합니다.

## 입력과 출력
- 입력: AST, `offsetToLoc`, base offset, `ParseOptions`
- 출력: `ParsedResult`

## 동작 흐름
- top-level에서 import/export 및 "use client" 확인
- 옵션에 따라 AST 전체 순회
- `locFromSpan`으로 위치 정보 계산

## 확장 포인트
- require/dynamic import 수집
- 새로운 시그널 수집 로직 추가
