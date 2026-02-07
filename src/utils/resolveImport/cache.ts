import type { Tsconfig } from "./types";

const tsconfigCache = new Map<string, Tsconfig | null>();
const resolveCache = new Map<string, string | null>();
const dirEntriesCache = new Map<string, Set<string> | null>();

export { tsconfigCache, resolveCache, dirEntriesCache };
