import type { Loc } from "./types";

function locFromSpan(
  span: any,
  offsetToLoc: (n: number) => Loc,
  baseOffset: number
) {
  if (!span || typeof span.start !== "number") return null;
  const relOffset = span.start - baseOffset + 1;
  return offsetToLoc(relOffset > 0 ? relOffset : span.start);
}

export { locFromSpan };
