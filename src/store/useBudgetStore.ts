import { create } from 'zustand';
import { getDatabase, generateId, BudgetRow, TransactionRow } from '../services/database';
import type { BudgetPeriod, BudgetWithProgress } from '../types';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
} from 'date-fns';
import { useCategoryStore } from './useCategoryStore';
import { BudgetThresholds } from '../constants';

interface BudgetState {
  budgets: BudgetRow[];
  budgetsWithProgress: BudgetWithProgress[];
  isLoading: boolean;
  error: string | null;

  loadBudgets: () => Promise<void>;
  calculateProgress: () => Promise<void>;
  addBudget: (data: {
    categoryId: string;
    amount: number;
    period: BudgetPeriod;
  }) => Promise<string>;
  updateBudget: (
    id: string,
    data: Partial<{
      amount: number;
      period: BudgetPeriod;
      isActive: boolean;
    }>
  ) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  getBudgetAlerts: () => BudgetWithProgress[];
}

const getPeriodRange = (period: BudgetPeriod): { start: Date; end: Date } => {
  const now = new Date();
  switch (period) {
    case 'weekly':
      return { start: startOfWeek(now), end: endOfWeek(now) };
    case 'monthly':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'yearly':
      return { start: startOfYear(now), end: endOfYear(now) };
  }
};

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: [],
  budgetsWithProgress: [],
  isLoading: false,
  error: null,

  loadBudgets: async () => {
    set({ isLoading: true, error: null });
    try {
      const db = getDatabase();
      const budgets = db.getAllSync<BudgetRow>('SELECT * FROM budgets WHERE is_active = 1');
      set({ budgets, isLoading: false });
      await get().calculateProgress();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  calculateProgress: async () => {
    const { budgets } = get();
    const db = getDatabase();
    const { getCategoryById } = useCategoryStore.getState();

    const budgetsWithProgress: BudgetWithProgress[] = budgets.map((budget) => {
      const { start, end } = getPeriodRange(budget.period as BudgetPeriod);
      const category = getCategoryById(budget.category_id);

      const transactions = db.getAllSync<TransactionRow>(
        `SELECT * FROM transactions WHERE category_id = ? AND type = 'debit' AND date >= ? AND date <= ?`,
        [budget.category_id, start.getTime(), end.getTime()]
      );

      const spent = transactions.reduce((sum, t) => sum + t.amount, 0);
      const remaining = Math.max(0, budget.amount - spent);
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

      return {
        id: budget.id,
        categoryId: budget.category_id,
        amount: budget.amount,
        period: budget.period as BudgetPeriod,
        startDate: new Date(budget.start_date),
        isActive: budget.is_active === 1,
        createdAt: new Date(budget.created_at),
        updatedAt: new Date(budget.updated_at),
        spent,
        remaining,
        percentage,
        category: category
          ? {
              id: category.id,
              name: category.name,
              icon: category.icon,
              color: category.color,
              isIncome: category.is_income === 1,
              createdAt: new Date(category.created_at),
              updatedAt: new Date(category.updated_at),
            }
          : undefined,
      };
    });

    set({ budgetsWithProgress });
  },

  addBudget: async (data) => {
    const db = getDatabase();
    const id = generateId();
    const now = Date.now();

    db.runSync(
      'INSERT INTO budgets (id, category_id, amount, period, start_date, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, data.categoryId, data.amount, data.period, now, 1, now, now]
    );

    await get().loadBudgets();
    return id;
  },

  updateBudget: async (id, data) => {
    const db = getDatabase();
    const now = Date.now();

    const updates: string[] = ['updated_at = ?'];
    const params: any[] = [now];

    if (data.amount !== undefined) {
      updates.push('amount = ?');
      params.push(data.amount);
    }
    if (data.period !== undefined) {
      updates.push('period = ?');
      params.push(data.period);
    }
    if (data.isActive !== undefined) {
      updates.push('is_active = ?');
      params.push(data.isActive ? 1 : 0);
    }

    params.push(id);
    db.runSync(`UPDATE budgets SET ${updates.join(', ')} WHERE id = ?`, params);

    await get().loadBudgets();
  },

  deleteBudget: async (id) => {
    const db = getDatabase();
    db.runSync('DELETE FROM budgets WHERE id = ?', [id]);
    await get().loadBudgets();
  },

  getBudgetAlerts: () => {
    return get().budgetsWithProgress.filter(
      (b) => b.percentage >= BudgetThresholds.warning * 100
    );
  },
}));
