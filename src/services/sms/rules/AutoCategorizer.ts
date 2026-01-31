import { getDatabase, CategoryRow, CategoryRuleRow } from '../../database';
import { MerchantCategoryMap } from '../../../constants';

export class AutoCategorizer {
  private categories: CategoryRow[] = [];
  private customRules: CategoryRuleRow[] = [];

  async loadRules(): Promise<void> {
    const db = getDatabase();

    // Load categories
    this.categories = db.getAllSync<CategoryRow>('SELECT * FROM categories');

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
        const category = this.categories.find(
          (c) => c.name.toLowerCase() === categoryName.toLowerCase()
        );
        if (category) {
          return category.id;
        }
      }
    }

    return null;
  }

  getCategoryName(categoryId: string): string | null {
    const category = this.categories.find((c) => c.id === categoryId);
    return category?.name || null;
  }
}
