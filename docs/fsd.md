# patternier FSD Rules

FSD(Feature-Sliced Design) 패턴을 위한 기본 규칙 목록과 설정 방법입니다.

---

## 사용 방법

```bash
patternier check
patternier check --format json
patternier check --summary
patternier inspect ./src/features/auth/index.ts
```

---

## 설정 파일

지원하는 파일명:

- `patternier.config.mjs`
- `patternier.*.config.mjs` (예: `patternier.base.config.mjs`)

---

## 모노레포에서 사용하기

루트에 베이스 설정을 두고 `extends`로 상속하세요.

```js
// patternier.base.config.mjs
import { definePatternConfig } from "patternier";

export const config = definePatternConfig({
  type: "fsd",
  rootDir: "src",
  rules: {
    "@patternier/no-layer-to-higher-import": "error",
  },
});
```

```js
// packages/foo/patternier.config.mjs
import { definePatternConfig } from "patternier";

export const config = definePatternConfig({
  extends: "../../patternier.base.config.mjs",
  rootDir: "src",
});
```

---

## 기본 제공 규칙

아래 규칙들은 `type: "fsd"`일 때 사용 가능합니다.

### @patternier/no-layer-to-higher-import
하위 레이어가 상위 레이어를 import 하지 못하도록 제한합니다.

### @patternier/no-cross-slice-import
같은 레이어 내 다른 slice로의 직접 import를 금지합니다.  
기본값은 `features` 레이어만 적용합니다.

옵션:
```js
options: { layers: ["features", "entities"] }
```

### @patternier/ui-no-side-effects
`ui` 경로에서 `fetch`/`axios` 사용을 금지합니다.

### @patternier/slice-no-usage
slice 기반 레이어는 `<layer>/<slice>/...` 구조를 강제합니다.  
예: `features/ui` 같은 경로는 에러입니다.

예약어(직접 사용 불가):
`ui`, `model`, `lib`, `utils`, `config`, `types`, `constants`, `assets`, `styles`, `hooks`

옵션:
```js
options: { reservedSegments: ["custom"], targetLayers: ["features", "pages"], mode: "extend" }
```

### @patternier/segment-no-usage
slice 아래에 `<segment>` 폴더를 강제합니다.  
구조: `<layer>/<slice>/<segment>/...`

옵션:
```js
options: { segments: ["custom"], targetLayers: ["features", "pages"], mode: "extend" }
```

---

## 옵트인(기본 off) 규칙

### @patternier/model-no-presentation
`model` 경로에서 JSX 또는 템플릿 리터럴을 금지합니다.  
모델 레이어를 순수 상태로 유지하기 위한 규칙입니다.

### @patternier/use-client-only-ui
`"use client"`는 기본적으로 `**/ui/**` 경로에서만 허용됩니다.  
`exclude`로 예외 경로를 허용할 수 있습니다.

옵션:
```js
options: { allow: ["**/ui/**"], exclude: ["**/aa/**"] }
```

### @patternier/no-deep-import
깊은 경로 import를 제한합니다. 기본 깊이는 3입니다.

옵션:
```js
options: { maxDepth: 3 }
```

---

## 설정 예시

```js
// patternier.config.mjs
import { definePatternConfig } from "patternier";

export const config = definePatternConfig({
  type: "fsd",
  rootDir: "src",
  rules: {
    "@patternier/no-layer-to-higher-import": "error",
    "@patternier/no-cross-slice-import": "error",
    "@patternier/ui-no-side-effects": "error",
    "@patternier/slice-no-usage": "error",
    "@patternier/model-no-presentation": "error",
    "@patternier/use-client-only-ui": "error",
    "@patternier/no-deep-import": "error",
  },
});
```

---

## 레이어/슬라이스 커스터마이징

레이어 순서와 slice 기반 레이어를 커스터마이징할 수 있습니다.

```js
layers: {
  order: ["app", "pages", "widgets", "features", "entities", "shared"],
  sliceLayers: ["features", "entities", "widgets"],
}
```
