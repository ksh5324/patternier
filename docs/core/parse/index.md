# src/core/parse/index.ts

## 개요
SWC로 파일을 파싱하고, 필요한 정보를 수집한 뒤 캐시합니다.

## 입력과 출력
- 입력: 파일 경로, `ParseOptions`
- 출력: `ParsedResult`

## 동작 흐름
- `(path + 옵션)` 기준 캐시 확인 (mtime 기반)
- 파일 읽기 및 offset 매핑 생성
- 확장자에 맞는 SWC 파싱
- `collectFromAst`로 필요한 데이터 수집
- 캐시 저장 후 반환

## 확장 포인트
- 파서 옵션 최소화/커스터마이징
- 캐시 정책 변경(LRU, 해시 기반 등)
- 수집 항목 확장
