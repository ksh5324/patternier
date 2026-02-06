// tsup.config.ts
import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    cli: "src/cli.ts",
    index: "src/index.ts"
  },
  format: ["esm"],
  target: "node18",
  outDir: "dist",
  sourcemap: true,
  clean: true,
  dts: true,

  // CLI용
  banner: {
    js: "#!/usr/bin/env node"
  },

  // node builtins / deps는 번들 안 함
  external: [
    "@swc/core",
    "picomatch"
  ]
});
