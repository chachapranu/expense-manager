# Contributing to Expense Manager

Thanks for your interest in contributing! This guide will help you get started.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/expense-manager.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b feature/your-feature-name`

## Development Workflow

1. **Create a GitHub issue** before starting any bug fix or feature
2. Reference the issue number in your PR
3. Run checks before submitting:

```bash
npx tsc --noEmit     # Type check — must pass
npm run lint         # Lint — must pass
npm test             # Tests — must pass
```

## Code Conventions

### General
- TypeScript strict mode — no `any` types in new code
- Use existing patterns in the codebase as reference
- Keep changes focused — one feature or fix per PR

### Transactions
- Types are `'credit'` (income) and `'debit'` (expense), stored as strings
- IDs are UUID v4 (`generateId()` from database service)
- Timestamps are millisecond epoch (`Date.now()`, `date.getTime()`)

### State Management
- Zustand stores in `src/store/`
- Each store talks to SQLite directly via `getDatabase()`
- Dashboard aggregations (`getMonthlyTotal`, `getDailyTotal`) query the DB, not the store array

### SMS Parsers
- Extend `BaseBankParser` for new bank parsers
- Override `parse()` only if the bank uses non-standard formats
- Add sender patterns to both the parser and `src/constants/index.ts`
- Ignore rules must never filter messages containing transaction keywords (credited, debited, etc.)

### UI
- React Native Paper components
- Monochrome/grayscale theme — use colors from `src/constants/index.ts`
- No custom color values outside the theme

## Adding a Bank Parser

This is one of the most useful contributions. To add support for a new bank:

1. Collect 10-20 sample SMS messages from the bank (anonymize amounts/accounts)
2. Create `src/services/sms/parsers/YourBankParser.ts`
3. Add tests in `src/services/sms/parsers/__tests__/`
4. Register the parser in `src/services/sms/parsers/index.ts`
5. Add sender patterns to `BANK_SENDER_PATTERNS` in `src/constants/index.ts`

Use `AxisParser.ts` or `HSBCParser.ts` as reference for complex formats.

## Pull Request Guidelines

- Keep PRs small and focused
- Include a clear description of what changed and why
- Add tests for new parsers and business logic
- Screenshots for UI changes
- Ensure all checks pass

## Reporting Bugs

Open an issue with:
- Device model and Android version
- Steps to reproduce
- Expected vs actual behavior
- If SMS-related: the bank name and a sanitized version of the SMS (replace amounts/account numbers)

## Feature Requests

Open an issue describing:
- The problem you're trying to solve
- Your proposed solution
- Any alternatives you considered
