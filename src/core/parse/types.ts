export type Loc = { line: number; col: number };

export type ParsedImport = {
  kind: "esm";
  source: string | null;
  typeOnly: boolean;
  specifiers: { type: string; local: string | null; imported: string | null }[];
  loc: Loc | null;
};

export type ParsedResult = {
  imports: ParsedImport[];
  exports: any[];
  requires: any[];
  dynamicImports: any[];
  fetchCalls: { loc: Loc | null }[];
  jsxUsages: { loc: Loc | null }[];
  templateLiterals: { loc: Loc | null }[];
  directives: { useClient: boolean };
};

export type ParseOptions = {
  needFetchCalls?: boolean;
  needJsx?: boolean;
  needTemplateLiterals?: boolean;
  needUseClient?: boolean;
};

export type ParseCacheEntry = {
  mtimeMs: number;
  key: string;
  result: ParsedResult;
};
