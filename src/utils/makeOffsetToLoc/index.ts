function makeOffsetToLoc(code: string) {
  const lineStartByteOffsets: number[] = [0];
  const lineStartCodeUnitOffsets: number[] = [0];
  const charByteOffsets: number[] = [];
  const charCodeUnitOffsets: number[] = [];

  let byteOffset = 0;
  let codeUnitOffset = 0;

  for (const ch of code) {
    charByteOffsets.push(byteOffset);
    charCodeUnitOffsets.push(codeUnitOffset);

    const byteLen = Buffer.byteLength(ch, "utf8");
    const codeUnitLen = ch.length;

    if (ch === "\n") {
      lineStartByteOffsets.push(byteOffset + byteLen);
      lineStartCodeUnitOffsets.push(codeUnitOffset + codeUnitLen);
    }

    byteOffset += byteLen;
    codeUnitOffset += codeUnitLen;
  }

  function byteOffsetToCodeUnitOffset(offset: number) {
    let lo = 0;
    let hi = charByteOffsets.length - 1;
    let idx = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (charByteOffsets[mid] <= offset) {
        idx = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return idx >= 0 ? charCodeUnitOffsets[idx] : 0;
  }

  function offsetToLoc(offset: number) {
    // 마지막 lineStartOffsets <= offset 찾기 (이진탐색)
    let lo = 0;
    let hi = lineStartByteOffsets.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (lineStartByteOffsets[mid] <= offset) lo = mid + 1;
      else hi = mid - 1;
    }
    const lineIndex = Math.max(0, lo - 1);
    const line = lineIndex + 1;
    const codeUnitAt = byteOffsetToCodeUnitOffset(offset);
    const col = codeUnitAt - lineStartCodeUnitOffsets[lineIndex] + 1; // 1-based
    return { line, col };
  }

  return { offsetToLoc };
}

export { makeOffsetToLoc };
