import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native';
import { Text, Surface, SegmentedButtons } from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { Colors } from '../../constants';
import { formatCurrency } from '../../utils/formatters';
import { useTransactionStore } from '../../store/useTransactionStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { EmptyState } from '../../components/common/EmptyState';
import type { CategoryBreakdown } from '../../types';

type TimeRange = '1M' | '3M' | '6M' | '1Y';

export default function ReportsScreen() {
  const { transactions, isLoading, loadTransactions } = useTransactionStore();
  const { categories, loadCategories, getCategoryById } = useCategoryStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('1M');

  useFocusEffect(
    useCallback(() => {
      loadCategories();
      loadTransactions();
    }, [])
  );

  const getDateRange = () => {
    const now = new Date();
    switch (timeRange) {
      case '1M':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case '3M':
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case '6M':
        return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) };
      case '1Y':
        return { start: startOfMonth(subMonths(now, 11)), end: endOfMonth(now) };
    }
  };

  const filteredTransactions = useMemo(() => {
    const { start, end } = getDateRange();
    return transactions.filter(
      (t) =>
        t.type === 'debit' &&
        t.date >= start.getTime() &&
        t.date <= end.getTime()
    );
  }, [transactions, timeRange]);

  const categoryBreakdown = useMemo((): CategoryBreakdown[] => {
    const totals: Record<string, { amount: number; count: number }> = {};
    let totalAmount = 0;

    filteredTransactions.forEach((t) => {
      const categoryId = t.category_id || 'uncategorized';
      if (!totals[categoryId]) {
        totals[categoryId] = { amount: 0, count: 0 };
      }
      totals[categoryId].amount += t.amount;
      totals[categoryId].count += 1;
      totalAmount += t.amount;
    });

    return Object.entries(totals)
      .map(([categoryId, data]) => {
        const category = getCategoryById(categoryId);
        return {
          categoryId,
          categoryName: category?.name || 'Uncategorized',
          categoryColor: category?.color || Colors.textSecondary,
          amount: data.amount,
          percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
          count: data.count,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, categories]);

  const totalExpense = categoryBreakdown.reduce((sum, c) => sum + c.amount, 0);

  if (filteredTransactions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.filterContainer}>
          <SegmentedButtons
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as TimeRange)}
            buttons={[
              { value: '1M', label: '1M' },
              { value: '3M', label: '3M' },
              { value: '6M', label: '6M' },
              { value: '1Y', label: '1Y' },
            ]}
            style={styles.segmentedButtons}
          />
        </View>
        <EmptyState
          icon="chart-pie"
          title="No data available"
          message="Add some transactions to see your spending reports"
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={loadTransactions}
          colors={[Colors.primary]}
        />
      }
    >
      <View style={styles.filterContainer}>
        <SegmentedButtons
          value={timeRange}
          onValueChange={(value) => setTimeRange(value as TimeRange)}
          buttons={[
            { value: '1M', label: '1M' },
            { value: '3M', label: '3M' },
            { value: '6M', label: '6M' },
            { value: '1Y', label: '1Y' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {/* Total Expense Card */}
      <Surface style={styles.totalCard} elevation={0}>
        <Text style={styles.totalLabel}>Total Expenses</Text>
        <Text style={styles.totalAmount}>{formatCurrency(totalExpense)}</Text>
        <Text style={styles.totalPeriod}>
          {timeRange === '1M'
            ? 'This month'
            : timeRange === '3M'
            ? 'Last 3 months'
            : timeRange === '6M'
            ? 'Last 6 months'
            : 'Last 12 months'}
        </Text>
      </Surface>

      {/* Category Breakdown */}
      <Surface style={styles.chartCard} elevation={1}>
        <Text style={styles.chartTitle}>Spending by Category</Text>

        {categoryBreakdown.map((category) => (
          <View key={category.categoryId} style={styles.categoryRow}>
            <View style={styles.categoryInfo}>
              <View
                style={[
                  styles.categoryDot,
                  { backgroundColor: category.categoryColor },
                ]}
              />
              <Text style={styles.categoryLabel} numberOfLines={1}>
                {category.categoryName}
              </Text>
            </View>
            <View style={styles.categoryStats}>
              <Text style={styles.categoryAmount}>
                {formatCurrency(category.amount)}
              </Text>
              <Text style={styles.categoryPercent}>
                {Math.round(category.percentage)}%
              </Text>
            </View>
          </View>
        ))}

        {/* Category bars visualization */}
        <View style={styles.barsContainer}>
          {categoryBreakdown.slice(0, 6).map((category) => (
            <View key={category.categoryId} style={styles.barRow}>
              <View style={styles.barBackground}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${category.percentage}%`,
                      backgroundColor: category.categoryColor,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </Surface>

      {/* Top Spending Categories */}
      <Surface style={styles.chartCard} elevation={1}>
        <Text style={styles.chartTitle}>Top Spending</Text>
        {categoryBreakdown.slice(0, 5).map((category, index) => (
          <View key={category.categoryId} style={styles.topSpendingItem}>
            <Text style={styles.topSpendingRank}>#{index + 1}</Text>
            <View
              style={[
                styles.topSpendingIcon,
                { backgroundColor: category.categoryColor },
              ]}
            >
              <MaterialCommunityIcons
                name={
                  (categories.find((c) => c.id === category.categoryId)?.icon as any) ||
                  'shape'
                }
                size={16}
                color="#fff"
              />
            </View>
            <View style={styles.topSpendingInfo}>
              <Text style={styles.topSpendingName}>{category.categoryName}</Text>
              <Text style={styles.topSpendingCount}>
                {category.count} transaction{category.count !== 1 ? 's' : ''}
              </Text>
            </View>
            <Text style={styles.topSpendingAmount}>
              {formatCurrency(category.amount)}
            </Text>
          </View>
        ))}
      </Surface>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  filterContainer: {
    padding: 16,
  },
  segmentedButtons: {
    backgroundColor: Colors.surface,
  },
  totalCard: {
    margin: 16,
    marginTop: 0,
    padding: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  totalLabel: {
    fontSize: 14,
    color: '#888888',
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginTop: 8,
  },
  totalPeriod: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
  },
  chartCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryLabel: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  categoryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginRight: 8,
  },
  categoryPercent: {
    fontSize: 12,
    color: Colors.textSecondary,
    width: 40,
    textAlign: 'right',
  },
  barsContainer: {
    marginTop: 16,
  },
  barRow: {
    marginBottom: 8,
  },
  barBackground: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  topSpendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  topSpendingRank: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    width: 30,
  },
  topSpendingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topSpendingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  topSpendingName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  topSpendingCount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  topSpendingAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  bottomSpacer: {
    height: 24,
  },
});
