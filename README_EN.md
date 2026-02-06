# patternier

A configurable architecture linter for large frontend codebases.

> 🚧 **Early stage project**  
> patternier is in early development. APIs, rules, and configuration may change.

---

## Why patternier?

As frontend codebases grow, architecture rules become harder to enforce:
- Feature-to-feature imports start leaking
- Layer boundaries get blurry
- ESLint rules alone can’t express architectural intent

**patternier** is a rule-based architecture linter designed to enforce
scalable frontend patterns such as **Feature-Sliced Design (FSD)** — and more in the future.

---

## Features (0.0.1)

- ✅ Architecture-aware rules (layer / slice based)
- ✅ Configurable rules via `patternier.config.mjs`
- ✅ FSD preset with sensible defaults
- ✅ `.patternierignore` support
- ✅ CLI-first workflow (CI-friendly)

---

## Installation

```bash
pnpm add -D patternier
