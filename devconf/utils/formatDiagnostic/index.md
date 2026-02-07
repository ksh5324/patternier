# src/utils/formatDiagnostic/index.ts

## 개요
진단 정보를 사람이 읽기 쉬운 문자열로 포맷합니다.

## 입력과 출력
- 입력: 파일 경로, 진단 객체(ruleId, message, loc)
- 출력: 포맷된 문자열

## 동작 흐름
- 위치가 있으면 `line:col`, 없으면 `0:0` 사용
- `<file>:<pos>  <rule>  <message>` 형태로 반환

## 확장 포인트
- JSON 출력 옵션
- 컬러/단계별 포맷
