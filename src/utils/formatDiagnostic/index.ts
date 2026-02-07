export function formatDiagnostic(
    filePath: string,
    d: {
      ruleId: string;
      message: string;
      loc?: { line: number; col: number } | null;
    }
  ) {
    const pos = d.loc ? `${d.loc.line}:${d.loc.col}` : "0:0";
    return `${filePath}:${pos}  ${d.ruleId}  ${d.message}`;
  }
  