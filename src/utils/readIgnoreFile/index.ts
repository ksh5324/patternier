import fs from "node:fs/promises";

async function readIgnoreFile(absPath: string): Promise<string[]> {
  try {
    const raw = await fs.readFile(absPath, "utf8");
    return raw
      .split(/\r?\n/g)
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .filter((l) => !l.startsWith("#"));
  } catch (e: any) {
    if (e?.code === "ENOENT") return [];
    throw e;
  }
}

export { readIgnoreFile };
