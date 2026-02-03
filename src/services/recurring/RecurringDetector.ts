import { getDatabase } from '../database';

export interface RecurringSuggestion {
  merchant: string;
  averageAmount: number;
  count: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  averageIntervalDays: number;
}

interface MerchantStats {
  merchant: string;
  count: number;
  total: number;
  avg_amount: number;
  min_amount: number;
  max_amount: number;
  min_date: number;
  max_date: number;
}

export class RecurringDetector {
  detect(): RecurringSuggestion[] {
    const db = getDatabase();
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;

    const stats = db.getAllSync<MerchantStats>(
      `SELECT
        merchant,
        COUNT(*) as count,
        SUM(amount) as total,
        AVG(amount) as avg_amount,
        MIN(amount) as min_amount,
        MAX(amount) as max_amount,
        MIN(date) as min_date,
        MAX(date) as max_date
      FROM transactions
      WHERE type = 'debit'
        AND date >= ?
        AND merchant IS NOT NULL
        AND merchant != ''
      GROUP BY merchant
      HAVING COUNT(*) >= 2`,
      [ninetyDaysAgo]
    );

    const suggestions: RecurringSuggestion[] = [];

    for (const stat of stats) {
      // Check amount consistency: (max - min) / avg < 0.2
      if (stat.avg_amount > 0) {
        const variance = (stat.max_amount - stat.min_amount) / stat.avg_amount;
        if (variance >= 0.2) continue;
      }

      // Calculate average interval
      const totalSpanDays = (stat.max_date - stat.min_date) / (1000 * 60 * 60 * 24);
      const averageIntervalDays = stat.count > 1 ? totalSpanDays / (stat.count - 1) : 30;

      const frequency = this.inferFrequency(averageIntervalDays);

      suggestions.push({
        merchant: stat.merchant,
        averageAmount: Math.round(stat.avg_amount * 100) / 100,
        count: stat.count,
        frequency,
        averageIntervalDays: Math.round(averageIntervalDays),
      });
    }

    return suggestions.sort((a, b) => b.count - a.count);
  }

  private inferFrequency(avgDays: number): RecurringSuggestion['frequency'] {
    if (avgDays <= 2) return 'daily';
    if (avgDays <= 10) return 'weekly';
    if (avgDays <= 45) return 'monthly';
    return 'yearly';
  }
}

export const recurringDetector = new RecurringDetector();
