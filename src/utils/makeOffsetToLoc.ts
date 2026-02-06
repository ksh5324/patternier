function makeOffsetToLoc(code: string) {
    const lineStartOffsets: number[] = [0];
    for (let i = 0; i < code.length; i++) {
        if (code[i] === "\n") lineStartOffsets.push(i + 1);
    }

    function offsetToLoc(offset: number) {
        // 마지막 lineStartOffsets <= offset 찾기 (이진탐색)
        let lo = 0, hi = lineStartOffsets.length - 1;
        while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (lineStartOffsets[mid] <= offset) lo = mid + 1;
        else hi = mid - 1;
        }
        const lineIndex = Math.max(0, lo - 1);
        const line = lineIndex + 1;
        const col = offset - lineStartOffsets[lineIndex] + 1; // 1-based
        return { line, col };
    }

    return { offsetToLoc };
}

export { makeOffsetToLoc };