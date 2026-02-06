// patternier.config.mjs
import { definePatternConfig } from "./dist/index.js";

export const config = definePatternConfig({
  type: "fsd",
  rootDir: 'fixtures',
  layers: {
    order: ["app", "pages", "widgets", "features", "entities", "shared"],
  },
  rules: {
    "@patternier/no-layer-to-higher-import": "error",
    "@patternier/no-cross-slice-import": "error",
    "@patternier/model-no-presentation": "error",
    "@patternier/use-client-only-ui": "error",
    "@patternier/no-deep-import": "error"
  }
});
