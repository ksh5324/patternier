function usage() {
  console.log(`patternier

Usage:
  patternier inspect <file>
  patternier check [file]
  patternier check [file] --type fsd

Examples:
  pnpm dev inspect fixtures/features/a/index.ts
  pnpm dev check fixtures/features/a/index.ts
  pnpm dev check
`);
}

export { usage };
