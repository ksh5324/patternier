# src/cli/files.ts

## 개요
CLI용 파일 탐색/검증/ignore 처리를 담당합니다.

## 입력과 출력
- 입력: repo root, ignore 패턴, 파일 경로
- 출력: 파일 리스트 또는 절대 경로

## 동작 흐름
- 기본 ignore + 사용자 ignore를 matcher로 구성
- 디렉토리를 순회하며 소스 확장자만 수집
- 단일 파일 인자는 확장자/파일 여부를 검증

## 확장 포인트
- ignore 규칙 강화
- 파일 탐색 성능 최적화
