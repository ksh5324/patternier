# src/cli.ts

## 개요
`patternier` CLI 진입점입니다. 인자를 파싱하고 설정/ignore를 로드한 뒤, 대상 파일을 검사하고 진단 결과와 종료 코드를 출력합니다.

## 입력과 출력
- 입력: `process.argv`, `patternier.config.mjs`, `.patternierignore`, 파일 시스템
- 출력: `inspect`는 JSON stdout, `check`는 포맷된 진단 출력, `process.exitCode` 설정

## 동작 흐름
- 커맨드와 파일 인자 파싱
- `loadConfig`로 설정 로드
- 기본 ignore + ignore 파일 + config ignore를 합쳐 matcher 구성
- `inspect`: 단일 파일 검사 후 JSON 출력
- `check`: 대상 파일을 모아 검사하고 진단을 출력

## 확장 포인트
- 새로운 커맨드/옵션 추가
- ignore 처리 방식 개선
- 출력 포맷/요약 출력 추가
