# Little Journey

Baby milestone journal app for Singapore market (Expo, iOS + Android).

## Commands

```bash
npm run lint    # ESLint flat config
```

## Key Config

- Expo SDK 54, managed workflow
- New Architecture + React Compiler enabled
- Strict TypeScript, typed routes

## Docs

- [Architecture](docs/claude/architecture.md) - tech stack, routing structure
- [Conventions](docs/claude/conventions.md) - components, theming
- [Plan Mode](docs/claude/plan-mode.md) - planning preferences

## TDD Workflow

Follow strict Test-Driven Development:

1. Write failing tests for requirements—include edge cases
2. Run tests and confirm they FAIL
3. Commit the tests
4. WAIT for approval before implementing
5. Implement code until tests pass—do NOT modify tests
6. Commit working implementation

No mocks unless absolutely necessary.