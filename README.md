# patternier

대규모 프론트엔드 코드베이스를 위한 **아키텍처 린터**입니다.

> 🚧 **초기 개발 단계(Early stage)**  
> patternier는 현재 초기 개발 단계에 있으며, API·룰·설정 방식은 변경될 수 있습니다.

---

## patternier는 왜 필요한가요?

프론트엔드 프로젝트가 커질수록 아키텍처 규칙을 지키기 어려워집니다.

- feature 간 의존성이 뒤섞이고
- 레이어 경계가 무너지며
- ESLint만으로는 “아키텍처 의도”를 표현하기 어렵습니다

**patternier**는 이런 문제를 해결하기 위해 만들어진  
**아키텍처 인식 기반(rule-based) 린터**입니다.

현재는 **Feature-Sliced Design(FSD)** 패턴을 기본으로 지원하며,  
앞으로 더 다양한 아키텍처 패턴을 지원할 수 있도록 설계되었습니다.

---

## 주요 기능 (v0.0.1)

- ✅ 레이어 / 슬라이스 기반 아키텍처 룰
- ✅ `patternier.config.mjs`를 통한 유연한 설정
- ✅ FSD 프리셋 기본 제공
- ✅ `.patternierignore` 지원 (gitignore 포맷)
- ✅ CLI 기반 워크플로우 (CI 친화적)

---

## 성능 관련 노트

현재는 일반적인 비동기 처리와 캐시 전략으로 충분한 성능을 목표로 합니다.  
프로젝트 규모가 커져 체감 속도가 느려질 경우, 워커 스레드 도입을 고려합니다.

---

## 설치

```bash
pnpm add -D patternier
```

---

## ESLint와의 차이, 그리고 함께 쓰는 이유

ESLint가 **문법/코드 품질(syntax, correctness)** 을 다룬다면,  
patternier는 **아키텍처/패턴(pattern, layer/slice)** 을 다룹니다.

둘은 관심사가 달라서 같이 쓰면 더 좋은 개발자 경험을 줍니다.

- **관심사 분리**: 문법 규칙과 아키텍처 규칙을 분리하면 유지보수가 쉽습니다.
- **의도 표현**: ESLint로 표현하기 어려운 레이어 경계/슬라이스 규칙을 명확히 정의합니다.
- **협업 안정성**: 아키텍처 붕괴를 CI에서 빠르게 감지할 수 있습니다.

---

## Zero Config (설정 없이도 동작)

`patternier.config.mjs` 없이도 기본 FSD 규칙으로 바로 사용할 수 있습니다.

```bash
pnpm patternier check
pnpm patternier inspect ./src/features/auth/index.ts
```

---

## 최소 설정 예시

`definePatternConfig` 타입을 제공하기 때문에, 최소한의 설정만으로도 기본 규칙을 바로 적용할 수 있습니다.

```js
// patternier.config.mjs
import { definePatternConfig } from "patternier";

export const config = definePatternConfig({
  type: "fsd",
});
```

---

## 문서

- FSD 사용법: `docs/fsd.md`
- 내부 구현 노트: `devconf/`

---

## 더 특별한 점

- **아키텍처 인식 규칙**: 레이어/슬라이스 구조를 이해하고 규칙을 실행합니다.
- **검사 대상 제어**: `.patternierignore`로 불필요한 경로를 쉽게 제외할 수 있습니다.
- **개발/CI 친화적**: CLI 중심 워크플로우로 빠르게 통합 가능합니다.

---

## 알려진 이슈

- 모노레포에서 `extends`를 사용할 경우 `rootDir`이 기대대로 적용되지 않을 수 있습니다. 각 패키지의 `patternier.config.mjs`에 `rootDir`을 명시하면 안정적으로 동작합니다.
