# src/cli/args.ts

## 개요
CLI 인자를 파싱해 커맨드, 파일, 타입, 출력 포맷을 분리합니다.

## 입력과 출력
- 입력: `process.argv`
- 출력: `{ cmd, fileArg, cliType, format, invalid }`

## 동작 흐름
- `--type`, `--format` 옵션 파싱
- 첫 번째 비옵션을 `cmd`, 두 번째를 `fileArg`로 처리
- 알 수 없는 옵션이면 `invalid` 플래그 설정

## 확장 포인트
- 추가 플래그 지원
- 에러 메시지 개선
