# src/utils/resolveImport/resolve.ts

## 개요
파일 시스템을 기준으로 실제 파일 경로를 찾아주는 리졸버 유틸 모음입니다.

## 입력과 출력
- 입력: source 문자열, fromFile, tsconfig paths 정보
- 출력: 해석된 절대 경로 또는 `null`

## 동작 흐름
- 확장자/`index` 파일까지 고려해 실파일을 찾음
- 상대 경로 해석
- tsconfig `paths` 패턴 매칭

## 확장 포인트
- `.d.ts`/`.mts`/`.cts` 지원
- 폴더 패키지 해석 규칙 추가
