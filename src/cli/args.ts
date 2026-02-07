type ParsedArgs = {
  cmd?: string;
  fileArg?: string;
  cliType?: string;
  invalid?: boolean;
};

function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  let cmd: string | undefined;
  let fileArg: string | undefined;
  let cliType: string | undefined;

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

  return { cmd, fileArg, cliType };
}

export { parseArgs };
export type { ParsedArgs };
