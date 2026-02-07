import type { ParseCacheEntry, ParseOptions } from "./types";

const parseCache = new Map<string, ParseCacheEntry>();

function makeOptionKey(opts?: ParseOptions) {
  return [
    opts?.needFetchCalls ? "f1" : "f0",
    opts?.needJsx ? "j1" : "j0",
    opts?.needTemplateLiterals ? "t1" : "t0",
    opts?.needUseClient ? "u1" : "u0",
  ].join("");
}

export { parseCache, makeOptionKey };
