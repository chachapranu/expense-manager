// Transaction types
export type TransactionType = 'debit' | 'credit';
export type TransactionSource = 'sms' | 'manual';

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  date: Date;
  notes?: string;
  merchant?: string;
  categoryId?: string;
  accountId?: string;
  source: TransactionSource;
  rawSms?: string;
  referenceNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Category types
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isIncome: boolean;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Account types
export interface Account {
  id: string;
  name: string;
  type: 'bank' | 'credit_card' | 'wallet' | 'cash';
  bankName?: string;
  lastFourDigits?: string;
  color: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Budget types
export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly';

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  period: BudgetPeriod;
  startDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetWithProgress extends Budget {
  spent: number;
  remaining: number;
  percentage: number;
  category?: Category;
}

// Ignore rule types
export type IgnoreRuleType = 'sender' | 'keyword' | 'regex';

export interface IgnoreRule {
  id: string;
  type: IgnoreRuleType;
  pattern: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Recurring rule types
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringRule {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
  categoryId?: string;
  accountId?: string;
  frequency: RecurringFrequency;
  dayOfMonth?: number;
  dayOfWeek?: number;
  nextDueDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Category rule for auto-categorization
export interface CategoryRule {
  id: string;
  pattern: string;
  categoryId: string;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// SMS types
export interface SmsMessage {
  _id: string;
  address: string;
  body: string;
  date: number;
  date_sent: number;
  type: number;
  read: number;
}

export interface ParsedTransaction {
  amount: number;
  type: TransactionType;
  merchant?: string;
  accountLastFour?: string;
  bankName?: string;
  referenceNumber?: string;
  balance?: number;
  date: Date;
  rawSms: string;
}

// Filter types
export interface TransactionFilter {
  search?: string;
  categoryId?: string;
  accountId?: string;
  type?: TransactionType;
  startDate?: Date;
  endDate?: Date;
  source?: TransactionSource;
}

// Report types
export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface MonthlyTrend {
  month: string;
  year: number;
  income: number;
  expense: number;
}

export interface DailySpending {
  date: string;
  amount: number;
}
