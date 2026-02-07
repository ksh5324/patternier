# src/pattern/fsd/rules/model/modelNoPresentation.ts

## 개요
`model` 경로에서 JSX 및 템플릿 리터럴 사용을 금지합니다.

## 입력과 출력
- 입력: 파일 경로, JSX/템플릿 사용 목록
- 출력: 진단 배열

## 동작 흐름
- `model` 경로인지 확인
- JSX 또는 템플릿 리터럴 사용 시 진단 생성

## 확장 포인트
- 문자열 템플릿 허용 옵션
