import { getDatabase, CategoryRow, CategoryRuleRow } from '../../database';
import { MerchantCategoryMap } from '../../../constants';

export class AutoCategorizer {
  private categories: CategoryRow[] = [];
  private customRules: CategoryRuleRow[] = [];
  private categoryByName: Map<string, CategoryRow> = new Map();
  private categoryById: Map<string, CategoryRow> = new Map();

  async loadRules(): Promise<void> {
    const db = getDatabase();

    // Load categories
    this.categories = db.getAllSync<CategoryRow>('SELECT * FROM categories');

    // Build lookup maps
    this.categoryByName.clear();
    this.categoryById.clear();
    for (const category of this.categories) {
      this.categoryByName.set(category.name.toLowerCase(), category);
      this.categoryById.set(category.id, category);
    }

    // Load custom category rules
    this.customRules = db.getAllSync<CategoryRuleRow>(
      'SELECT * FROM category_rules WHERE is_active = 1 ORDER BY priority DESC'
    );
  }

  categorize(merchant: string | undefined, rawSms: string): string | null {
    if (!merchant && !rawSms) return null;

    const searchText = `${merchant || ''} ${rawSms}`.toLowerCase();

    // First, check custom rules (higher priority)
    for (const rule of this.customRules) {
      if (searchText.includes(rule.pattern.toLowerCase())) {
        return rule.category_id;
      }
    }

    // Then, check built-in merchant category map
    for (const [pattern, categoryName] of Object.entries(MerchantCategoryMap)) {
      if (searchText.includes(pattern.toLowerCase())) {
        const category = this.categoryByName.get(categoryName.toLowerCase());
        if (category) {
          return category.id;
        }
      }
    }

    return null;
  }

  getCategoryName(categoryId: string): string | null {
    const category = this.categoryById.get(categoryId);
    return category?.name || null;
  }
}
