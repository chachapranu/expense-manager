# Expense Manager

Personal finance app for Indian users. React Native + Expo (v54), TypeScript, Expo Router v6 (file-based routing), Zustand stores, Expo SQLite, React Native Paper.

## Commands

- `npm start` — dev server
- `npm run android` — run on Android
- `npx tsc --noEmit` — type check (run after changes)
- `npm run lint` — eslint
- `npm test` — jest (minimal test coverage currently)

## Architecture

- **Routing:** `src/app/` — Expo Router file-based. Tabs in `(tabs)/`, settings in `settings/`.
- **State:** Zustand stores in `src/store/` — each store talks to SQLite directly via `getDatabase()`.
- **Data:** SQLite via `expo-sqlite`. Schema in `src/services/database/index.ts`. Timestamps are ms epoch. IDs are UUID v4.
- **SMS parsing:** Strategy pattern. `BaseBankParser` (abstract) → bank-specific parsers → `GenericParser` fallback (uses `transaction-sms-parser` npm package). Orchestrated by `SmsService`. Android only.
- **UI:** React Native Paper components. Monochrome/grayscale theme defined in `src/constants/index.ts`.

## Key conventions

- Always create a GitHub issue before starting a bug fix or feature.
- Transaction types are `'credit'` (income) and `'debit'` (expense) — stored as strings in SQLite.
- Dashboard aggregations (`getMonthlyTotal`, `getRecentTransactions`) query the DB directly, not the filtered store array.
- SMS ignore rules must never filter out messages containing transaction keywords (credited, debited, etc.).

## Reference docs

Read these files when working on related areas:

- `src/services/sms/parsers/BaseBankParser.ts` — amount/type/merchant extraction regex patterns
- `src/services/sms/SmsService.ts` — SMS sync pipeline (read → ignore → parse → dedup → categorize → save)
- `src/services/database/index.ts` — full DB schema, all table definitions
- `src/constants/index.ts` — bank sender patterns, merchant→category mappings, theme colors
