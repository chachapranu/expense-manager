import { create } from 'zustand';
import { getDatabase, generateId, CategoryRow } from '../services/database';

interface CategoryState {
  categories: CategoryRow[];
  isLoading: boolean;
  error: string | null;

  loadCategories: () => Promise<void>;
  addCategory: (data: {
    name: string;
    icon: string;
    color: string;
    isIncome: boolean;
    parentId?: string;
  }) => Promise<string>;
  updateCategory: (
    id: string,
    data: Partial<{
      name: string;
      icon: string;
      color: string;
      isIncome: boolean;
      parentId: string;
    }>
  ) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoryById: (id: string) => CategoryRow | undefined;
  getExpenseCategories: () => CategoryRow[];
  getIncomeCategories: () => CategoryRow[];
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,

  loadCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const db = getDatabase();
      const categories = db.getAllSync<CategoryRow>('SELECT * FROM categories ORDER BY name ASC');
      set({ categories, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addCategory: async (data) => {
    const db = getDatabase();
    const id = generateId();
    const now = Date.now();

    db.runSync(
      'INSERT INTO categories (id, name, icon, color, is_income, parent_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, data.name, data.icon, data.color, data.isIncome ? 1 : 0, data.parentId || null, now, now]
    );

    await get().loadCategories();
    return id;
  },

  updateCategory: async (id, data) => {
    const db = getDatabase();
    const now = Date.now();

    const updates: string[] = ['updated_at = ?'];
    const params: any[] = [now];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    if (data.icon !== undefined) {
      updates.push('icon = ?');
      params.push(data.icon);
    }
    if (data.color !== undefined) {
      updates.push('color = ?');
      params.push(data.color);
    }
    if (data.isIncome !== undefined) {
      updates.push('is_income = ?');
      params.push(data.isIncome ? 1 : 0);
    }
    if (data.parentId !== undefined) {
      updates.push('parent_id = ?');
      params.push(data.parentId || null);
    }

    params.push(id);
    db.runSync(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`, params);

    await get().loadCategories();
  },

  deleteCategory: async (id) => {
    const db = getDatabase();
    db.runSync('DELETE FROM categories WHERE id = ?', [id]);
    await get().loadCategories();
  },

  getCategoryById: (id) => {
    return get().categories.find((c) => c.id === id);
  },

  getExpenseCategories: () => {
    return get().categories.filter((c) => !c.is_income);
  },

  getIncomeCategories: () => {
    return get().categories.filter((c) => c.is_income === 1);
  },
}));
