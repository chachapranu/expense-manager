import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl } from 'react-native';
import {
  Text,
  Surface,
  FAB,
  Portal,
  Modal,
  TextInput,
  Button,
  SegmentedButtons,
  List,
} from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, BudgetThresholds } from '../../constants';
import { formatCurrency } from '../../utils';
import { useBudgetStore, useCategoryStore } from '../../store';
import { EmptyState } from '../../components/common';
import type { BudgetPeriod, BudgetWithProgress } from '../../types';

export default function BudgetsScreen() {
  const {
    budgetsWithProgress,
    isLoading,
    loadBudgets,
    addBudget,
    updateBudget,
    deleteBudget,
  } = useBudgetStore();
  const { categories, loadCategories, getExpenseCategories } = useCategoryStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<BudgetWithProgress | null>(null);
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<BudgetPeriod>('monthly');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
      loadBudgets();
    }, [])
  );

  const expenseCategories = getExpenseCategories();
  const selectedCategory = selectedCategoryId
    ? categories.find((c) => c.id === selectedCategoryId)
    : null;

  const usedCategoryIds = budgetsWithProgress.map((b) => b.categoryId);
  const availableCategories = expenseCategories.filter(
    (c) => !usedCategoryIds.includes(c.id)
  );

  const resetForm = () => {
    setAmount('');
    setPeriod('monthly');
    setSelectedCategoryId('');
    setSelectedBudget(null);
  };

  const handleAddBudget = async () => {
    if (!selectedCategoryId || !amount || parseFloat(amount) <= 0) {
      return;
    }

    setIsSaving(true);
    try {
      await addBudget({
        categoryId: selectedCategoryId,
        amount: parseFloat(amount),
        period,
      });
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to add budget:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditBudget = (budget: BudgetWithProgress) => {
    setSelectedBudget(budget);
    setAmount(budget.amount.toString());
    setPeriod(budget.period);
    setSelectedCategoryId(budget.categoryId);
    setShowEditModal(true);
  };

  const handleUpdateBudget = async () => {
    if (!selectedBudget || !amount || parseFloat(amount) <= 0) {
      return;
    }

    setIsSaving(true);
    try {
      await updateBudget(selectedBudget.id, {
        amount: parseFloat(amount),
        period,
      });
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to update budget:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBudget = async () => {
    if (!selectedBudget) return;

    setIsSaving(true);
    try {
      await deleteBudget(selectedBudget.id);
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to delete budget:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= BudgetThresholds.danger * 100) return Colors.expense;
    if (percentage >= BudgetThresholds.warning * 100) return Colors.warning;
    return Colors.income;
  };

  const renderBudgetCard = (budget: BudgetWithProgress) => {
    const progressColor = getProgressColor(budget.percentage);

    return (
      <Surface
        key={budget.id}
        style={styles.budgetCard}
        elevation={1}
        onTouchEnd={() => handleEditBudget(budget)}
      >
        <View style={styles.budgetHeader}>
          <View style={styles.categoryInfo}>
            <View
              style={[
                styles.categoryIcon,
                { backgroundColor: budget.category?.color || Colors.textSecondary },
              ]}
            >
              <MaterialCommunityIcons
                name={(budget.category?.icon as any) || 'shape'}
                size={20}
                color="#fff"
              />
            </View>
            <View>
              <Text style={styles.categoryName}>
                {budget.category?.name || 'Unknown'}
              </Text>
              <Text style={styles.periodLabel}>
                {budget.period.charAt(0).toUpperCase() + budget.period.slice(1)} budget
              </Text>
            </View>
          </View>
          <View style={styles.amountInfo}>
            <Text style={[styles.spentAmount, { color: progressColor }]}>
              {formatCurrency(budget.spent)}
            </Text>
            <Text style={styles.budgetAmount}>
              of {formatCurrency(budget.amount)}
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(100, budget.percentage)}%`,
                  backgroundColor: progressColor,
                },
              ]}
            />
          </View>
          <Text style={[styles.percentageText, { color: progressColor }]}>
            {Math.round(budget.percentage)}%
          </Text>
        </View>

        <View style={styles.budgetFooter}>
          <Text style={styles.remainingText}>
            {budget.remaining > 0
              ? `${formatCurrency(budget.remaining)} remaining`
              : `${formatCurrency(budget.spent - budget.amount)} over budget`}
          </Text>
        </View>
      </Surface>
    );
  };

  return (
    <View style={styles.container}>
      {budgetsWithProgress.length === 0 ? (
        <EmptyState
          icon="wallet"
          title="No budgets set"
          message="Create budgets to track your spending by category"
          actionLabel="Add Budget"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={loadBudgets}
              colors={[Colors.primary]}
            />
          }
        >
          {budgetsWithProgress.map(renderBudgetCard)}
        </ScrollView>
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
        color="#fff"
        disabled={availableCategories.length === 0}
      />

      {/* Add Budget Modal */}
      <Portal>
        <Modal
          visible={showAddModal}
          onDismiss={() => {
            setShowAddModal(false);
            resetForm();
          }}
          contentContainerStyle={styles.modalContent}
        >
          <Text style={styles.modalTitle}>Add Budget</Text>

          <Button
            mode="outlined"
            onPress={() => setShowCategoryPicker(true)}
            style={styles.categoryButton}
            icon={() =>
              selectedCategory ? (
                <MaterialCommunityIcons
                  name={selectedCategory.icon as any}
                  size={20}
                  color={selectedCategory.color}
                />
              ) : (
                <MaterialCommunityIcons
                  name="shape"
                  size={20}
                  color={Colors.textSecondary}
                />
              )
            }
          >
            {selectedCategory?.name || 'Select Category'}
          </Button>

          <TextInput
            mode="outlined"
            label="Budget Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            left={<TextInput.Affix text="₹" />}
            style={styles.input}
          />

          <Text style={styles.periodLabel}>Budget Period</Text>
          <SegmentedButtons
            value={period}
            onValueChange={(value) => setPeriod(value as BudgetPeriod)}
            buttons={[
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'yearly', label: 'Yearly' },
            ]}
            style={styles.segmentedButtons}
          />

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => {
                setShowAddModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleAddBudget}
              loading={isSaving}
              disabled={!selectedCategoryId || !amount || isSaving}
            >
              Add Budget
            </Button>
          </View>
        </Modal>

        {/* Category Picker Modal */}
        <Modal
          visible={showCategoryPicker}
          onDismiss={() => setShowCategoryPicker(false)}
          contentContainerStyle={styles.categoryPickerContent}
        >
          <Text style={styles.modalTitle}>Select Category</Text>
          <ScrollView style={styles.categoryList}>
            {availableCategories.map((category) => (
              <List.Item
                key={category.id}
                title={category.name}
                onPress={() => {
                  setSelectedCategoryId(category.id);
                  setShowCategoryPicker(false);
                }}
                left={() => (
                  <View
                    style={[
                      styles.listCategoryIcon,
                      { backgroundColor: category.color },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={category.icon as any}
                      size={20}
                      color="#fff"
                    />
                  </View>
                )}
              />
            ))}
          </ScrollView>
        </Modal>

        {/* Edit Budget Modal */}
        <Modal
          visible={showEditModal}
          onDismiss={() => {
            setShowEditModal(false);
            resetForm();
          }}
          contentContainerStyle={styles.modalContent}
        >
          <Text style={styles.modalTitle}>Edit Budget</Text>

          <View style={styles.editCategoryInfo}>
            <View
              style={[
                styles.categoryIcon,
                { backgroundColor: selectedBudget?.category?.color || Colors.textSecondary },
              ]}
            >
              <MaterialCommunityIcons
                name={(selectedBudget?.category?.icon as any) || 'shape'}
                size={20}
                color="#fff"
              />
            </View>
            <Text style={styles.editCategoryName}>
              {selectedBudget?.category?.name}
            </Text>
          </View>

          <TextInput
            mode="outlined"
            label="Budget Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            left={<TextInput.Affix text="₹" />}
            style={styles.input}
          />

          <Text style={styles.periodLabel}>Budget Period</Text>
          <SegmentedButtons
            value={period}
            onValueChange={(value) => setPeriod(value as BudgetPeriod)}
            buttons={[
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'yearly', label: 'Yearly' },
            ]}
            style={styles.segmentedButtons}
          />

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={handleDeleteBudget}
              textColor={Colors.error}
              loading={isSaving}
            >
              Delete
            </Button>
            <Button
              mode="contained"
              onPress={handleUpdateBudget}
              loading={isSaving}
              disabled={!amount || isSaving}
            >
              Save
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  budgetCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    marginBottom: 12,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  periodLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 8,
  },
  amountInfo: {
    alignItems: 'flex-end',
  },
  spentAmount: {
    fontSize: 18,
    fontWeight: '600',
  },
  budgetAmount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentageText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '600',
    width: 45,
    textAlign: 'right',
  },
  budgetFooter: {
    marginTop: 12,
  },
  remainingText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: Colors.primary,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  categoryButton: {
    marginBottom: 16,
    justifyContent: 'flex-start',
  },
  input: {
    marginBottom: 16,
    backgroundColor: Colors.surface,
  },
  segmentedButtons: {
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryPickerContent: {
    backgroundColor: Colors.surface,
    margin: 20,
    borderRadius: 12,
    maxHeight: '70%',
  },
  categoryList: {
    maxHeight: 400,
  },
  listCategoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  editCategoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  editCategoryName: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
});
