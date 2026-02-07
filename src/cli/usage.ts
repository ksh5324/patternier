function usage() {
  console.log(`patternier

Usage:
  patternier inspect <file>
  patternier check [file]
  patternier check [file] --type fsd
  patternier check [file] --format json
  patternier check [file] --format sarif
  patternier --help
  patternier --version

Examples:
  pnpm dev inspect fixtures/features/a/index.ts
  pnpm dev check fixtures/features/a/index.ts
  pnpm dev check
`);
}

export { usage };
