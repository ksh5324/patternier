import fs from "node:fs/promises";
import ignore from "ignore";

type IgnoreMatcher = (relPath: string) => boolean;

async function readIgnoreFile(absPath: string): Promise<IgnoreMatcher> {
  try {
    const raw = await fs.readFile(absPath, "utf8");
    const ig = ignore();
    ig.add(raw);
    return (relPath: string) => ig.ignores(relPath);
  } catch (e: any) {
    if (e?.code === "ENOENT") return () => false;
    throw e;
  }
}

export { readIgnoreFile };
export type { IgnoreMatcher };
