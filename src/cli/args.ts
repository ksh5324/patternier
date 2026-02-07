type ParsedArgs = {
  cmd?: string;
  fileArg?: string;
  cliType?: string;
  format?: string;
  help?: boolean;
  version?: boolean;
  summary?: boolean;
  printConfig?: boolean;
  invalid?: boolean;
};

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  let cmd: string | undefined;
  let fileArg: string | undefined;
  let cliType: string | undefined;
  let format: string | undefined;
  let help = false;
  let version = false;
  let summary = false;
  let printConfig = false;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--type") {
      cliType = args[i + 1];
      i++;
      continue;
    }
    if (a.startsWith("--type=")) {
      cliType = a.slice("--type=".length);
      continue;
    }
    if (a === "--format") {
      format = args[i + 1];
      i++;
      continue;
    }
    if (a.startsWith("--format=")) {
      format = a.slice("--format=".length);
      continue;
    }
    if (a === "--help" || a === "-h") {
      help = true;
      continue;
    }
    if (a === "--version" || a === "-v") {
      version = true;
      continue;
    }
    if (a === "--summary") {
      summary = true;
      continue;
    }
    if (a === "--print-config") {
      printConfig = true;
      continue;
    }
    if (a.startsWith("-")) {
      return { invalid: true };
    }
    if (!cmd) {
      cmd = a;
      continue;
    }
    if (!fileArg) {
      fileArg = a;
      continue;
    }
  }

  return { cmd, fileArg, cliType, format, help, version, summary, printConfig };
}

export { parseArgs };
export type { ParsedArgs };
