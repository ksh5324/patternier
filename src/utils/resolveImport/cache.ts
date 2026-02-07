import type { Tsconfig } from "./types";

const tsconfigCache = new Map<string, Tsconfig | null>();
const resolveCache = new Map<string, string | null>();

export { tsconfigCache, resolveCache };
