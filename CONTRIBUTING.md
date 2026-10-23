# Contributing to Vapor

Thank you for your interest in contributing. Vapor aims to stay simple,
accurate, and dependency-free at runtime.

## Principles

- Prefer HTML, CSS, and vanilla JavaScript ES modules.
- Keep calculator math in pure functions under `assets/js/calculators/`.
- Do not introduce runtime dependencies, bundlers, or frameworks.
- Do not add analytics, tracking, or remote APIs.
- Keep the UI bilingual-free: English only.
- Prefer clarity over abstraction.

## Development setup

1. Clone the repository.
2. Serve the project root with any static HTTP server.
3. Optionally install development dependencies for tests:

```bash
pnpm install
pnpm test
```

You do not need `node_modules` to use the website.

## Making changes

1. Create a focused branch.
2. Update or add tests for math changes.
3. Keep styles in CSS files; avoid inline CSS and inline JavaScript.
4. Preserve accessibility: labels, keyboard access, and visible focus states.
5. Run `pnpm test` before opening a pull request.

## Pull requests

- Describe the problem and the solution.
- Note any UI or formula behavior changes.
- Keep diffs small when possible.

## Code of conduct

Please follow [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).
