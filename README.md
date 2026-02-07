# patternier

> **실무 프론트엔드 프로젝트를 위한 아키텍처 린터**  
> Feature-Sliced Design(FSD)와 구조 규칙을 CI 단계에서 강제합니다.

## ⚠️ **현재 버전: 0.0.3**

⚠️ **patternier는 현재 개발 중인 실험적(Early-stage) 프로젝트입니다.**  
API, 규칙, 동작 방식은 변경될 수 있습니다.

---

## patternier가 필요한 이유

프론트엔드 프로젝트가 커질수록  
**아키텍처 규칙은 조용히 무너집니다.**

- feature 간 무분별한 import
- UI 레이어에 비즈니스 로직 침투
- shared 레이어가 점점 의미 없는 공용 공간으로 변함
- “FSD를 사용한다”는 말만 문서에 남음

ESLint는 **문법, 스타일, 코드 품질**에는 강력하지만  
**아키텍처의 의도와 구조 자체를 강제할 수는 없습니다.**

**Patternier는 이 공백을 메우기 위해 만들어졌습니다.**

---

## patternier는 무엇을 하나요?

Patternier는 **Feature-Sliced Design(FSD)** 과  
구조 규칙을 기반으로 프로젝트 아키텍처를 검사하는  
**아키텍처 전용 린터**입니다.

다음과 같은 문제를 사전에 차단합니다:

- 잘못된 레이어 / 슬라이스 간 의존성
- 단방향 아키텍처 규칙 위반
- 무의식적으로 발생하는 구조 붕괴
- 리팩토링 시점에서 한꺼번에 터지는 구조 문제

Patternier는 **코드 스타일이 아니라 구조와 의도**에 집중합니다.

---

## Feature-Sliced Design(FSD)이란?

Feature-Sliced Design은 프론트엔드 코드를  
**레이어 → 슬라이스 → 세그먼트** 구조로 나누고,  
의존성 방향을 명확히 제한하는 아키텍처 방법론입니다.

핵심 개념:
- 기능(feature) 중심의 모듈 분리
- 엄격한 의존성 방향 규칙
- 예측 가능한 프로젝트 구조
- 대규모 팀과 장기 프로젝트에 적합

Patternier는 이 규칙을 **자동으로 검증**합니다.

---

## patternier와 ESLint의 차이

| 항목 | ESLint | Patternier |
|-----|--------|------------|
| 검사 대상 | 문법 / 코드 품질 | 아키텍처 / 구조 |
| 스타일 규칙 | ✅ | ❌ |
| 의존성 방향 검사 | ❌ | ✅ |
| FSD 규칙 강제 | ❌ | ✅ |
| CI에서 구조 보호 | ❌ | ✅ |

두 도구는 **경쟁 관계가 아니라 상호 보완 관계**입니다.

---

## 주요 기능

- FSD 레이어 / 슬라이스 / 세그먼트 구조 검사
- 의존성 방향성 강제
- 커스텀 규칙 설정
- `.patternierignore` 지원 (gitignore 포맷)
- 모노레포 extends 지원 (일부 제한 있음)
- CI 친화적인 CLI 기반 워크플로우
- 지원 환경:
    - JavaScript / TypeScript
    - Vue / React / Next.js
    - 혼합 스택

---

## 설치

```bash
pnpm add -D patternier@0.0.3-beta.1
# 또는
npm install -D patternier@0.0.3-beta.1
```
### 기본 사용법

```bash
patternier check
patternier inspect ./src/features/auth/index.ts
```

### CI 환경에서

```bash
patternier check --format sarif
patternier check --summary
```

### 출력/디버그 옵션

```bash
patternier check --format json
patternier check --summary
patternier check --print-config
```

## 모노레포 지원

공통 설정을 확장하는 방식으로 모노레포를 지원합니다.

```js
// patternier.base.config.mjs
import { definePatternConfig } from "patternier";

export const config = definePatternConfig({
  type: "fsd",
  rootDir: "src",
});
```

```js
// packages/app/patternier.config.mjs
import { definePatternConfig } from "patternier";

export const config = definePatternConfig({
  extends: "../../patternier.base.config.mjs",
  rootDir: "src",
});
```

⚠️ 일부 모노레포 케이스는 아직 개선 중입니다.

FSD 규칙 상세는 `docs/fsd.md`를 참고하세요.

## patternier가 하지 않는 것

❌ 코드 포맷팅

❌ 스타일 규칙 검사

❌ 비즈니스 로직 검증

❌ 런타임 검사

patternier는 아키텍처 전용 도구입니다.

## 현재 상태 (중요)

patternier는 개발 중인 실험적 프로젝트입니다.

- API 변경 가능성 있음
- 규칙 범위 지속 확장 중
- 일부 엣지 케이스 존재 가능
- 문서 지속 개선 중

하지만 현재 기준으로도:

- 실제 프로젝트에서 사용 가능
- CI 연동 가능
- Vue / React / Next.js 환경에서 검증 완료
- JS / TS 혼합 프로젝트 지원
- 다음과 같은 경우라면 충분히 시도해볼 가치가 있습니다:
- FSD를 도입했거나 도입을 검토 중인 팀
- 점점 커지는 프론트엔드 코드베이스를 관리 중인 경우

구조 붕괴로 인한 리팩토링 비용에 지친 경우
