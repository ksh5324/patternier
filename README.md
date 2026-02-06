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
- ✅ `.patternierignore` 지원
- ✅ CLI 기반 워크플로우 (CI 친화적)

---

## 설치

```bash
pnpm add -D patternier
