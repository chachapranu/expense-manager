import { create } from 'zustand';
import { getDatabase, generateId, TransactionRow } from '../services/database';
import type { TransactionType, TransactionSource, TransactionFilter } from '../types';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

interface TransactionState {
  transactions: TransactionRow[];
  isLoading: boolean;
  error: string | null;
  filter: TransactionFilter;

  loadTransactions: () => Promise<void>;
  addTransaction: (data: {
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
  }) => Promise<string>;
  updateTransaction: (
    id: string,
    data: Partial<{
      amount: number;
      type: TransactionType;
      date: Date;
      notes: string;
      merchant: string;
      categoryId: string;
      accountId: string;
    }>
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  setFilter: (filter: Partial<TransactionFilter>) => void;
  clearFilter: () => void;
  getMonthlyTotal: (type: TransactionType) => number;
  getWeeklyTotal: (type: TransactionType) => number;
  getRecentTransactions: (limit?: number) => TransactionRow[];
  getTransactionById: (id: string) => TransactionRow | undefined;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,
  filter: {},

  loadTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      const db = getDatabase();
      const { filter } = get();

      let query = 'SELECT * FROM transactions WHERE 1=1';
      const params: any[] = [];

      if (filter.categoryId) {
        query += ' AND category_id = ?';
        params.push(filter.categoryId);
      }
      if (filter.accountId) {
        query += ' AND account_id = ?';
        params.push(filter.accountId);
      }
      if (filter.type) {
        query += ' AND type = ?';
        params.push(filter.type);
      }
      if (filter.source) {
        query += ' AND source = ?';
        params.push(filter.source);
      }
      if (filter.startDate) {
        query += ' AND date >= ?';
        params.push(filter.startDate.getTime());
      }
      if (filter.endDate) {
        query += ' AND date <= ?';
        params.push(filter.endDate.getTime());
      }
      if (filter.search) {
        query += ' AND (merchant LIKE ? OR notes LIKE ?)';
        params.push(`%${filter.search}%`, `%${filter.search}%`);
      }

      query += ' ORDER BY date DESC';

      const transactions = db.getAllSync<TransactionRow>(query, params);
      set({ transactions, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addTransaction: async (data) => {
    const db = getDatabase();
    const id = generateId();
    const now = Date.now();

    db.runSync(
      `INSERT INTO transactions (id, amount, type, date, notes, merchant, category_id, account_id, source, raw_sms, reference_number, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.amount,
        data.type,
        data.date.getTime(),
        data.notes || null,
        data.merchant || null,
        data.categoryId || null,
        data.accountId || null,
        data.source,
        data.rawSms || null,
        data.referenceNumber || null,
        now,
        now,
      ]
    );

    await get().loadTransactions();
    return id;
  },

  updateTransaction: async (id, data) => {
    const db = getDatabase();
    const now = Date.now();

    const updates: string[] = ['updated_at = ?'];
    const params: any[] = [now];

    if (data.amount !== undefined) {
      updates.push('amount = ?');
      params.push(data.amount);
    }
    if (data.type !== undefined) {
      updates.push('type = ?');
      params.push(data.type);
    }
    if (data.date !== undefined) {
      updates.push('date = ?');
      params.push(data.date.getTime());
    }
    if (data.notes !== undefined) {
      updates.push('notes = ?');
      params.push(data.notes || null);
    }
    if (data.merchant !== undefined) {
      updates.push('merchant = ?');
      params.push(data.merchant || null);
    }
    if (data.categoryId !== undefined) {
      updates.push('category_id = ?');
      params.push(data.categoryId || null);
    }
    if (data.accountId !== undefined) {
      updates.push('account_id = ?');
      params.push(data.accountId || null);
    }

    params.push(id);
    db.runSync(`UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`, params);

    await get().loadTransactions();
  },

  deleteTransaction: async (id) => {
    const db = getDatabase();
    db.runSync('DELETE FROM transactions WHERE id = ?', [id]);
    await get().loadTransactions();
  },

  setFilter: (filter) => {
    set((state) => ({ filter: { ...state.filter, ...filter } }));
    get().loadTransactions();
  },

  clearFilter: () => {
    set({ filter: {} });
    get().loadTransactions();
  },

  getMonthlyTotal: (type) => {
    const { transactions } = get();
    const now = new Date();
    const start = startOfMonth(now).getTime();
    const end = endOfMonth(now).getTime();

    return transactions
      .filter((t) => t.type === type && t.date >= start && t.date <= end)
      .reduce((sum, t) => sum + t.amount, 0);
  },

  getWeeklyTotal: (type) => {
    const { transactions } = get();
    const now = new Date();
    const start = startOfWeek(now).getTime();
    const end = endOfWeek(now).getTime();

    return transactions
      .filter((t) => t.type === type && t.date >= start && t.date <= end)
      .reduce((sum, t) => sum + t.amount, 0);
  },

  getRecentTransactions: (limit = 5) => {
    return get().transactions.slice(0, limit);
  },

  getTransactionById: (id) => {
    return get().transactions.find((t) => t.id === id);
  },
}));
