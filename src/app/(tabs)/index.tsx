import React, { useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native';
import { Text, Surface, FAB, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, BudgetThresholds } from '../../constants';
import { formatCurrency, formatMonth } from '../../utils';
import { useTransactionStore, useCategoryStore, useBudgetStore } from '../../store';
import { TransactionItem } from '../../components/transactions';
import { useFocusEffect } from 'expo-router';

export default function DashboardScreen() {
  const router = useRouter();
  const {
    transactions,
    isLoading,
    loadTransactions,
    getMonthlyTotal,
    getRecentTransactions,
  } = useTransactionStore();
  const { loadCategories } = useCategoryStore();
  const { budgetsWithProgress, loadBudgets, getBudgetAlerts } = useBudgetStore();

  useFocusEffect(
    useCallback(() => {
      loadCategories();
      loadTransactions();
      loadBudgets();
    }, [])
  );

  const monthlyIncome = getMonthlyTotal('credit');
  const monthlyExpense = getMonthlyTotal('debit');
  const balance = monthlyIncome - monthlyExpense;
  const recentTransactions = getRecentTransactions(5);
  const budgetAlerts = getBudgetAlerts();

  const handleAddTransaction = () => {
    router.push('/transaction/add');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              loadTransactions();
              loadBudgets();
            }}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.monthLabel}>{formatMonth(new Date())}</Text>
          <IconButton
            icon="cog"
            iconColor="#fff"
            size={24}
            onPress={handleSettings}
          />
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <Surface style={[styles.summaryCard, styles.incomeCard]} elevation={2}>
            <MaterialCommunityIcons name="arrow-down-circle" size={28} color={Colors.income} />
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={[styles.summaryAmount, { color: Colors.income }]}>
              {formatCurrency(monthlyIncome)}
            </Text>
          </Surface>

          <Surface style={[styles.summaryCard, styles.expenseCard]} elevation={2}>
            <MaterialCommunityIcons name="arrow-up-circle" size={28} color={Colors.expense} />
            <Text style={styles.summaryLabel}>Expense</Text>
            <Text style={[styles.summaryAmount, { color: Colors.expense }]}>
              {formatCurrency(monthlyExpense)}
            </Text>
          </Surface>
        </View>

        {/* Balance Card */}
        <Surface style={styles.balanceCard} elevation={2}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text
            style={[
              styles.balanceAmount,
              { color: balance >= 0 ? Colors.income : Colors.expense },
            ]}
          >
            {formatCurrency(Math.abs(balance))}
          </Text>
        </Surface>

        {/* Budget Alerts */}
        {budgetAlerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Budget Alerts</Text>
            {budgetAlerts.map((budget) => (
              <Surface key={budget.id} style={styles.alertCard} elevation={1}>
                <View style={styles.alertContent}>
                  <View
                    style={[
                      styles.alertIcon,
                      {
                        backgroundColor:
                          budget.percentage >= BudgetThresholds.danger * 100
                            ? Colors.expense
                            : Colors.warning,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={(budget.category?.icon as any) || 'alert'}
                      size={20}
                      color="#fff"
                    />
                  </View>
                  <View style={styles.alertText}>
                    <Text style={styles.alertTitle}>
                      {budget.category?.name || 'Budget'}
                    </Text>
                    <Text style={styles.alertMessage}>
                      {budget.percentage >= 100
                        ? `Over budget by ${formatCurrency(budget.spent - budget.amount)}`
                        : `${Math.round(budget.percentage)}% used - ${formatCurrency(budget.remaining)} left`}
                    </Text>
                  </View>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(100, budget.percentage)}%`,
                        backgroundColor:
                          budget.percentage >= 100
                            ? Colors.expense
                            : budget.percentage >= 80
                            ? Colors.warning
                            : Colors.income,
                      },
                    ]}
                  />
                </View>
              </Surface>
            ))}
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            {recentTransactions.length > 0 && (
              <Text
                style={styles.seeAll}
                onPress={() => router.push('/transactions')}
              >
                See All
              </Text>
            )}
          </View>
          {recentTransactions.length === 0 ? (
            <Surface style={styles.emptyCard} elevation={1}>
              <MaterialCommunityIcons
                name="receipt"
                size={48}
                color={Colors.textSecondary}
              />
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>
                Tap the + button to add your first transaction
              </Text>
            </Surface>
          ) : (
            recentTransactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleAddTransaction}
        color="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: Colors.primary,
  },
  monthLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: -16,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  incomeCard: {
    marginRight: 8,
  },
  expenseCard: {
    marginLeft: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  balanceCard: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 8,
  },
  section: {
    paddingHorizontal: 0,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  seeAll: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  alertCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertText: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  alertMessage: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  emptyCard: {
    margin: 16,
    padding: 32,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 80,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: Colors.primary,
  },
});
