# src/config/definePatternConfig.ts

## 개요
패턴 타입별로 rules 타입을 추론하기 위한 설정 타입과 helper를 제공합니다.

## 입력과 출력
- 입력: `definePatternConfig`에 전달한 config
- 출력: 같은 config 객체(타입 보강)

## 동작 흐름
- `PatternType`, `PatternConfig<T>` 정의
- `RulesByType`로 타입별 rules 매핑
- `definePatternConfig`는 typed identity 함수

## 확장 포인트
- 새로운 패턴 타입/룰셋 추가
- config 옵션 확장(preset/resolver/ignores 등)
