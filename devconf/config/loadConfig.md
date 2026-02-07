# src/config/loadConfig.ts

## 개요
`patternier.config.mjs`를 로드합니다. 파일이 없으면 기본 설정을 반환합니다.

## 입력과 출력
- 입력: repo root 경로
- 출력: config 객체(`type` 기본값 포함)

## 동작 흐름
- config 경로 생성
- 파일 존재 여부 확인
- 동적 import 후 `config` 또는 `default` export 읽기
- 객체 타입 검증

## 확장 포인트
- 설정 파일 이름/형식 확장
- 스키마 검증 또는 더 친절한 오류 제공
