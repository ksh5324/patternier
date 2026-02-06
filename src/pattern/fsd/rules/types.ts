import { Diagnostic } from "./noLayerToHigherImport";

export type Loc = {
  line: number;
  col: number;
};

export type ImportInfo = {
  source: string | null;          // "@/features/a" | "./x"
  loc: Loc | null;
  // resolver 붙이면 여기에 추가:
  // resolvedPath?: string;
  // target?: { layer?: string; slice?: string | null };
};

export type FileMeta = {
  absPath: string;
  relPath: string;                // analysisRoot 기준
  layer: string;                  // "features" | "entities" | ...
  slice: string | null;
};

export type ParsedInfo = {
  imports: ImportInfo[];
  exports: any[];                 // 지금은 필요 없지만 확장용
  directives: {
    useClient: boolean;
  };
};

export type RuleContext = {
  file: FileMeta;
  parsed: ParsedInfo;

  // 미래 확장 포인트 (지금은 비워둬도 됨)
  // project?: {
  //   rootDir: string;
  // };
};

export type Rule = {
    id: string;
    defaultLevel: "error" | "warn" | "off";
    run: (ctx: RuleContext, options?: any) => Diagnostic[];
  };
  