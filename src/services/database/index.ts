import * as SQLite from 'expo-sqlite';
import { DefaultCategories } from '../../constants';

let db: SQLite.SQLiteDatabase | null = null;

export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!db) {
    db = SQLite.openDatabaseSync('expense-manager.db');
    initializeDatabase();
  }
  return db;
};

const initializeDatabase = () => {
  const database = db!;

  // Create tables
  database.execSync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      date INTEGER NOT NULL,
      notes TEXT,
      merchant TEXT,
      category_id TEXT,
      account_id TEXT,
      source TEXT NOT NULL,
      raw_sms TEXT,
      reference_number TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      is_income INTEGER NOT NULL DEFAULT 0,
      parent_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      bank_name TEXT,
      last_four_digits TEXT,
      color TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      amount REAL NOT NULL,
      period TEXT NOT NULL,
      start_date INTEGER NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ignore_rules (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      pattern TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS recurring_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      category_id TEXT,
      account_id TEXT,
      frequency TEXT NOT NULL,
      day_of_month INTEGER,
      day_of_week INTEGER,
      next_due_date INTEGER NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS category_rules (
      id TEXT PRIMARY KEY,
      pattern TEXT NOT NULL,
      category_id TEXT NOT NULL,
      priority INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  // Seed default categories if empty
  const count = database.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM categories');
  if (count && count.count === 0) {
    seedDefaultCategories();
  }
};

const seedDefaultCategories = () => {
  const database = db!;
  const now = Date.now();

  for (const cat of DefaultCategories) {
    const id = generateId();
    database.runSync(
      'INSERT INTO categories (id, name, icon, color, is_income, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, cat.name, cat.icon, cat.color, cat.isIncome ? 1 : 0, now, now]
    );
  }
};

export const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const resetDatabase = async (): Promise<void> => {
  const database = getDatabase();
  database.execSync(`
    DELETE FROM transactions;
    DELETE FROM categories;
    DELETE FROM accounts;
    DELETE FROM budgets;
    DELETE FROM ignore_rules;
    DELETE FROM recurring_rules;
    DELETE FROM category_rules;
  `);
  seedDefaultCategories();
};

// Transaction helpers
export interface TransactionRow {
  id: string;
  amount: number;
  type: string;
  date: number;
  notes: string | null;
  merchant: string | null;
  category_id: string | null;
  account_id: string | null;
  source: string;
  raw_sms: string | null;
  reference_number: string | null;
  created_at: number;
  updated_at: number;
}

export interface CategoryRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_income: number;
  parent_id: string | null;
  created_at: number;
  updated_at: number;
}

export interface BudgetRow {
  id: string;
  category_id: string;
  amount: number;
  period: string;
  start_date: number;
  is_active: number;
  created_at: number;
  updated_at: number;
}

export interface IgnoreRuleRow {
  id: string;
  type: string;
  pattern: string;
  is_active: number;
  created_at: number;
  updated_at: number;
}

export interface RecurringRuleRow {
  id: string;
  name: string;
  amount: number;
  type: string;
  category_id: string | null;
  account_id: string | null;
  frequency: string;
  day_of_month: number | null;
  day_of_week: number | null;
  next_due_date: number;
  is_active: number;
  created_at: number;
  updated_at: number;
}

export interface AccountRow {
  id: string;
  name: string;
  type: string;
  bank_name: string | null;
  last_four_digits: string | null;
  color: string;
  is_default: number;
  created_at: number;
  updated_at: number;
}

export interface CategoryRuleRow {
  id: string;
  pattern: string;
  category_id: string;
  priority: number;
  is_active: number;
  created_at: number;
  updated_at: number;
}
