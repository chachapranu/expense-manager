# Expense Manager

A secure, offline-first personal finance app for Indian users. Automatically imports transactions from bank SMS messages, categorizes spending, and tracks budgets — all without sending your data to any server.

## Why This App?

Most expense trackers require cloud accounts or share your financial data with third parties. Expense Manager keeps everything on your device:

- **100% Offline** — SQLite database stored locally, no internet required
- **Biometric Lock** — Fingerprint/face authentication on launch
- **SMS Auto-Import** — Reads bank SMS to create transactions automatically
- **Indian Banks** — Built-in parsers for HDFC, ICICI, SBI, Axis, HSBC, and UPI apps

## Features

### Transaction Management
- Automatic SMS-based transaction import (Android)
- Manual transaction entry for cash expenses
- Edit, delete, and search transactions
- Filter by type, category, account, date range, or source

### SMS Parsing
- **Bank-specific parsers:** HDFC, ICICI, SBI, Axis, HSBC
- **UPI parser:** Google Pay, PhonePe, Paytm, Amazon Pay, BHIM
- **Generic fallback** for other banks
- Deduplication to prevent double-counting
- Customizable ignore rules (filter spam/OTP messages)

### Budgets
- Set weekly, monthly, or yearly spending limits per category
- Visual progress bars with alerts at 80% and 100% thresholds
- Budget alerts on the dashboard

### Reports
- Category-wise expense breakdown
- Time range filters: 1 month, 3 months, 6 months, 1 year
- Spending percentages per category

### Other
- 21 default categories (15 expense, 6 income)
- Custom categories with icons and colors
- Multiple bank accounts
- Auto-categorization rules with merchant-to-category mapping
- Recurring transaction templates
- Data export
- Monochrome/grayscale UI theme

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.81 + Expo SDK 54 |
| Language | TypeScript 5.9 |
| Navigation | Expo Router v6 (file-based) |
| State | Zustand |
| Database | Expo SQLite |
| UI | React Native Paper (Material Design 3) |
| Auth | expo-local-authentication (biometric) |
| Lists | Shopify FlashList |

## Getting Started

### Prerequisites

- Node.js 18+
- Android device or emulator (SMS features are Android-only)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

### Installation

```bash
git clone https://github.com/chachapranu/expense-manager.git
cd expense-manager
npm install
```

### Development

```bash
# Start dev server
npm start

# Run on Android
npm run android

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Run tests
npm test
```

### Building APK

```bash
# Cloud build via EAS
npx eas build --platform android --profile local

# Local build (requires Android SDK + ~8GB RAM)
npx eas build --platform android --profile local --local
```

## Project Structure

```
src/
├── app/                        # Expo Router screens
│   ├── (tabs)/                 # Tab screens (dashboard, transactions, budgets, reports)
│   ├── settings/               # Settings screens
│   └── transaction/            # Add/edit transaction screens
├── components/                 # Reusable UI components
│   ├── common/                 # AmountDisplay, EmptyState, etc.
│   ├── transactions/           # TransactionList, TransactionItem, TransactionForm
│   ├── budgets/                # Budget components
│   └── reports/                # Report visualization
├── store/                      # Zustand stores
│   ├── useTransactionStore.ts  # Transaction CRUD & aggregations
│   ├── useBudgetStore.ts       # Budget management & progress
│   └── useCategoryStore.ts     # Category management
├── services/
│   ├── database/               # SQLite schema & initialization
│   └── sms/                    # SMS processing pipeline
│       ├── SmsService.ts       # Orchestrator: read → filter → parse → dedup → save
│       ├── parsers/            # Bank-specific SMS parsers
│       └── rules/              # IgnoreRuleEngine, AutoCategorizer
├── constants/                  # Colors, bank patterns, merchant mappings
├── types/                      # TypeScript interfaces
└── utils/                      # Formatters (currency, dates)
```

## SMS Parsing Pipeline

```
Bank SMS → Ignore Rules → Parser Selection → Extract Data → Dedup → Auto-Categorize → Save
```

1. **Read** — Fetch SMS from Android inbox (last 7-30 days)
2. **Filter** — Apply ignore rules (sender patterns, keywords, regex)
3. **Parse** — Try parsers in order: HDFC → ICICI → SBI → HSBC → Axis → UPI → Generic
4. **Deduplicate** — Skip if matching amount + date + merchant already exists
5. **Categorize** — Custom rules (priority-based) → merchant keyword mapping → default
6. **Save** — Insert into SQLite

### Adding a New Bank Parser

1. Create `src/services/sms/parsers/YourBankParser.ts` extending `BaseBankParser`
2. Set `bankName` and `senderPatterns` in the constructor
3. Override `parse()` if the bank uses non-standard SMS formats
4. Register in `src/services/sms/parsers/index.ts`
5. Add sender patterns to `BANK_SENDER_PATTERNS` in `src/constants/index.ts`

See `AxisParser.ts` or `HSBCParser.ts` for advanced examples with multiple regex patterns.

## Database

SQLite with 7 tables:

| Table | Purpose |
|-------|---------|
| `transactions` | All income/expense records |
| `categories` | Spending/income categories |
| `accounts` | Bank accounts |
| `budgets` | Spending limits per category |
| `ignore_rules` | SMS filtering patterns |
| `recurring_rules` | Recurring transaction templates |
| `category_rules` | Auto-categorization rules |

IDs are UUID v4. Timestamps are millisecond epoch. Schema is in `src/services/database/index.ts`.

## Permissions

| Permission | Purpose |
|-----------|---------|
| `READ_SMS` | Import bank transaction messages |
| `RECEIVE_SMS` | (Future) Real-time transaction alerts |
| `USE_BIOMETRIC` | Fingerprint/face lock on app launch |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)
