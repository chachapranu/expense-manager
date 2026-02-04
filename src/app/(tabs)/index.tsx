import React, { useEffect, useCallback, useMemo, useState, useRef } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, Platform } from 'react-native';
import { Text, Surface, FAB, IconButton, Snackbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, BudgetThresholds, useThemeColors } from '../../constants';
import { formatCurrency, formatMonth } from '../../utils/formatters';
import { useTransactionStore } from '../../store/useTransactionStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { useBudgetStore } from '../../store/useBudgetStore';
import { TransactionItem } from '../../components/transactions/TransactionItem';
import { useFocusEffect } from 'expo-router';
import { smsService } from '../../services/sms/SmsService';

const AUTO_SYNC_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
let lastAutoSyncTime = 0;

export default function DashboardScreen() {
  const router = useRouter();
  const {
    transactions,
    isLoading,
    loadTransactions,
    getMonthlyTotal,
    getDailyTotal,
    getRecentTransactions,
  } = useTransactionStore();
  const { loadCategories } = useCategoryStore();
  const { budgetsWithProgress, loadBudgets, getBudgetAlerts } = useBudgetStore();

  const colors = useThemeColors();
  const [isSyncing, setIsSyncing] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const runSmsSync = useCallback(async (isAuto: boolean) => {
    if (Platform.OS !== 'android') return;
    if (isSyncing) return;

    try {
      const hasPermission = await smsService.checkPermission();
      if (!hasPermission) return;

      setIsSyncing(true);
      const result = await smsService.syncTransactions(7);
      if (result.imported > 0) {
        await loadTransactions();
        loadBudgets();
        setSnackbar(`Imported ${result.imported} new transaction${result.imported > 1 ? 's' : ''}`);
      } else if (!isAuto) {
        setSnackbar('No new transactions found');
      }
    } catch (e) {
      if (!isAuto) {
        setSnackbar('SMS sync failed');
      }
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, loadTransactions, loadBudgets]);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
      loadTransactions();
      loadBudgets();

      // Auto-sync SMS with cooldown
      const now = Date.now();
      if (now - lastAutoSyncTime > AUTO_SYNC_COOLDOWN_MS) {
        lastAutoSyncTime = now;
        runSmsSync(true);
      }
    }, [])
  );

  const monthlyIncome = useMemo(() => getMonthlyTotal('credit'), [transactions]);
  const monthlyExpense = useMemo(() => getMonthlyTotal('debit'), [transactions]);
  const dailyExpense = useMemo(() => getDailyTotal('debit'), [transactions]);
  const balance = monthlyIncome - monthlyExpense;
  const recentTransactions = useMemo(() => getRecentTransactions(5), [transactions]);
  const budgetAlerts = useMemo(() => getBudgetAlerts(), [budgetsWithProgress]);

  const handleAddTransaction = () => {
    router.push('/transaction/add');
  };

  const handleSettings = () => {
    router.push('/settings');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={[styles.scrollView, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              loadTransactions();
              loadBudgets();
            }}
            colors={[colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <Text style={[styles.monthLabel, { color: colors.text }]}>{formatMonth(new Date())}</Text>
          <View style={styles.headerActions}>
            <IconButton
              icon="sync"
              iconColor={isSyncing ? colors.textSecondary : colors.text}
              size={24}
              onPress={() => runSmsSync(false)}
              disabled={isSyncing}
            />
            <IconButton
              icon="cog"
              iconColor={colors.text}
              size={24}
              onPress={handleSettings}
            />
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <Surface style={[styles.summaryCard, styles.incomeCard, { backgroundColor: colors.surface, borderColor: colors.border }]} elevation={0}>
            <MaterialCommunityIcons name="arrow-down-circle" size={28} color={colors.income} />
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Income</Text>
            <Text style={[styles.summaryAmount, { color: colors.income, fontWeight: '700' }]}>
              {formatCurrency(monthlyIncome)}
            </Text>
          </Surface>

          <Surface style={[styles.summaryCard, styles.expenseCard, { backgroundColor: colors.surface, borderColor: colors.border }]} elevation={0}>
            <MaterialCommunityIcons name="arrow-up-circle" size={28} color={colors.expense} />
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Expense</Text>
            <Text style={[styles.summaryAmount, { color: colors.expense, fontWeight: '400' }]}>
              {formatCurrency(monthlyExpense)}
            </Text>
          </Surface>
        </View>

        {/* Balance Card */}
        <Surface style={[styles.balanceCard, { backgroundColor: colors.surface, borderColor: colors.border }]} elevation={0}>
          <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Balance</Text>
          <Text
            style={[
              styles.balanceAmount,
              { color: balance >= 0 ? colors.income : colors.expense },
            ]}
          >
            {formatCurrency(Math.abs(balance))}
          </Text>
        </Surface>

        {/* Today's Expense */}
        <Surface style={[styles.todayCard, { backgroundColor: colors.surface, borderColor: colors.border }]} elevation={0}>
          <Text style={[styles.todayLabel, { color: colors.textSecondary }]}>Today</Text>
          <Text style={[styles.todayAmount, { color: colors.expense }]}>{formatCurrency(dailyExpense)}</Text>
        </Surface>

        {/* Budget Alerts */}
        {budgetAlerts.length > 0 ? (
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
                            ? '#333333'
                            : '#888888',
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
                            ? '#333333'
                            : budget.percentage >= 80
                            ? '#666666'
                            : '#000000',
                      },
                    ]}
                  />
                </View>
              </Surface>
            ))}
          </View>
        ) : null}

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            {recentTransactions.length > 0 ? (
              <Text
                style={styles.seeAll}
                onPress={() => router.push('/transactions')}
              >
                See All
              </Text>
            ) : null}
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
              <TransactionItem key={transaction.id} transaction={transaction} onEdit={(id) => router.push(`/transaction/${id}?edit=true`)} />
            ))
          )}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={handleAddTransaction}
        color={colors.background}
      />

      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar(null)}
        duration={3000}
        action={{ label: 'OK', onPress: () => setSnackbar(null) }}
      >
        {snackbar || ''}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
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
    borderWidth: 1,
    borderColor: '#E5E5E5',
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
    borderWidth: 1,
    borderColor: '#E5E5E5',
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
  todayCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todayLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  todayAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.expense,
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
