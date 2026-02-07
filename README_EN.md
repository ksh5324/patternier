# Patternier

> **Architecture-aware linting for real-world front-end projects**  
> Enforce Feature-Sliced Design (FSD) and structural rules at CI level.

⚠️ **Patternier is under active development (early-stage / experimental).**  
APIs and rules may change. Feedback and real-world usage are highly welcome.

---

## Why Patternier exists

In large front-end codebases, **architecture rules break silently**.

- Features start importing each other
- UI leaks business logic
- Shared layers become dumping grounds
- “We follow FSD” becomes documentation, not reality

ESLint is excellent at **syntax, style, and code quality**,  
but it **cannot enforce architectural intent**.

**Patternier exists to solve that gap.**

---

## What Patternier does

Patternier is an **architecture lint tool** that validates project structure
based on **Feature-Sliced Design (FSD)** and custom structural rules.

It helps teams:

- Detect invalid layer / slice dependencies
- Enforce unidirectional architecture rules
- Prevent accidental architectural erosion
- Fail CI early instead of discovering issues during refactors

Patternier focuses on **project structure and intent**, not code style.

---

## What is Feature-Sliced Design (FSD)?

Feature-Sliced Design is an architectural methodology that organizes
front-end code by **layers → slices → segments**, enforcing clear boundaries.

Core ideas:
- Feature-oriented modularization
- Strict dependency direction
- Predictable project structure
- Scalable for large teams and long-lived products

Patternier provides **automated enforcement** of these rules.

---

## Patternier vs ESLint

| Category | ESLint | Patternier |
|--------|--------|------------|
| Scope | Syntax & code quality | Architecture & structure |
| Style rules | ✅ | ❌ |
| Dependency direction | ❌ | ✅ |
| FSD enforcement | ❌ | ✅ |
| CI architecture guard | ❌ | ✅ |

They are **complementary**, not competing tools.

---

## Key Features

- FSD layer / slice / segment validation
- Dependency direction enforcement
- Custom rule configuration
- Ignore & override support
- Monorepo-compatible (with limitations)
- CLI-first workflow (CI friendly)
- Works with:
    - JavaScript / TypeScript
    - Vue / React / Next.js
    - Mixed stacks

---

## Installation

```bash
pnpm add -D patternier
# or
npm install -D patternier
```

### Basic Usage
```
npx patternier
```


### Or in CI:
```
pnpm patternier
```

## Monorepo Support

Patternier supports monorepo environments with shared configuration.

```js
export default {
  extends: ["../../patternier.config.mjs"],
  rootDir: "packages/app/src",
}
```

⚠️ Some monorepo edge cases are still under development.

## What Patternier intentionally does NOT do

❌ Code formatting

❌ Style enforcement

❌ Business logic validation

❌ Runtime checks

Patternier is architecture-only by design.

## Current Status (Important)

Patternier is actively developed and experimental.

APIs may change

Rule coverage is expanding

Some edge cases may exist

Documentation is evolving

That said:

It is already usable in real projects

## CI integration works

Multiple frameworks & setups are verified

If you're:

experimenting with FSD

maintaining a growing front-end codebase

tired of architecture drift

👉 Patternier is worth trying.

## Roadmap (Short-term)

More expressive rule error explanations

--explain / --why diagnostics

Better monorepo root resolution

Additional architecture presets

Feedback & Contribution

Patternier grows through real usage.
