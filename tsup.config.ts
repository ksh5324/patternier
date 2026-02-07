// tsup.config.ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    cli: "src/cli.ts",
    index: "src/index.ts",
    "pattern/fsd": "src/pattern/fsd/index.ts"
  },
  format: ["esm"],
  target: "node18",
  outDir: "dist",
  sourcemap: false,
  clean: true,
  dts: true,
  minify: true,

  // CLI용
  banner: {
    js: "#!/usr/bin/env node"
  },

  // node builtins / deps는 번들 안 함
  external: [
    "@swc/core",
    "picomatch",
    "ignore",
    "@vue/compiler-sfc"
  ]
});
