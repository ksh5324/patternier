# src/pattern/fsd/inspect.ts

## 개요
FSD 규칙을 실행하고 진단 결과를 수집합니다.

## 입력과 출력
- 입력: 파일 경로, 컨텍스트(repoRoot/analysisRoot/config)
- 출력: 파일 메타, 파싱 결과, diagnostics

## 동작 흐름
- 활성화된 규칙을 기준으로 필요한 파싱 옵션 결정
- `parseFile`로 필요한 정보만 수집
- import를 resolver로 해석하고 target 메타 주입
- 각 규칙을 실행해 진단 수집

## 확장 포인트
- 규칙별 파싱 요구 사항 추가
- 전역 컨텍스트(프로젝트 정보) 추가
