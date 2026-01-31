import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
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
  Switch,
} from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { Colors } from '../../constants';
import { formatCurrency } from '../../utils';
import { getDatabase, generateId, RecurringRuleRow } from '../../services/database';
import type { RecurringFrequency, TransactionType } from '../../types';
import { useCategoryStore } from '../../store';
import { EmptyState, LoadingScreen } from '../../components/common';

export default function RecurringScreen() {
  const { categories, loadCategories, getCategoryById } = useCategoryStore();
  const [rules, setRules] = useState<RecurringRuleRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState<RecurringRuleRow | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('debit');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [categoryId, setCategoryId] = useState<string>('');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadRules = async () => {
    try {
      const db = getDatabase();
      const fetchedRules = db.getAllSync<RecurringRuleRow>(
        'SELECT * FROM recurring_rules ORDER BY next_due_date ASC'
      );
      setRules(fetchedRules);
    } catch (error) {
      console.error('Failed to load recurring rules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCategories();
      loadRules();
    }, [])
  );

  const selectedCategory = categoryId ? getCategoryById(categoryId) : null;

  const getNextDueDate = (): Date => {
    const now = new Date();
    switch (frequency) {
      case 'daily':
        return addDays(now, 1);
      case 'weekly':
        return addWeeks(now, 1);
      case 'monthly':
        const day = parseInt(dayOfMonth) || 1;
        const nextMonth = addMonths(now, 1);
        return new Date(nextMonth.getFullYear(), nextMonth.getMonth(), Math.min(day, 28));
      case 'yearly':
        return addYears(now, 1);
    }
  };

  const resetForm = () => {
    setName('');
    setAmount('');
    setType('debit');
    setFrequency('monthly');
    setCategoryId('');
    setDayOfMonth('1');
    setSelectedRule(null);
  };

  const handleAddRule = async () => {
    if (!name.trim() || !amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid name and amount');
      return;
    }

    setIsSaving(true);
    try {
      const db = getDatabase();
      const now = Date.now();
      const id = generateId();

      db.runSync(
        `INSERT INTO recurring_rules (id, name, amount, type, category_id, account_id, frequency, day_of_month, next_due_date, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          name.trim(),
          parseFloat(amount),
          type,
          categoryId || null,
          null,
          frequency,
          frequency === 'monthly' ? parseInt(dayOfMonth) || 1 : null,
          getNextDueDate().getTime(),
          1,
          now,
          now,
        ]
      );

      setShowAddModal(false);
      resetForm();
      await loadRules();
    } catch (error) {
      console.error('Failed to add rule:', error);
      Alert.alert('Error', 'Failed to add recurring expense');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditRule = (rule: RecurringRuleRow) => {
    setSelectedRule(rule);
    setName(rule.name);
    setAmount(rule.amount.toString());
    setType(rule.type as TransactionType);
    setFrequency(rule.frequency as RecurringFrequency);
    setCategoryId(rule.category_id || '');
    setDayOfMonth(rule.day_of_month?.toString() || '1');
    setShowEditModal(true);
  };

  const handleUpdateRule = async () => {
    if (!selectedRule || !name.trim() || !amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid name and amount');
      return;
    }

    setIsSaving(true);
    try {
      const db = getDatabase();
      const now = Date.now();

      db.runSync(
        `UPDATE recurring_rules SET name = ?, amount = ?, type = ?, category_id = ?, frequency = ?, day_of_month = ?, updated_at = ?
         WHERE id = ?`,
        [
          name.trim(),
          parseFloat(amount),
          type,
          categoryId || null,
          frequency,
          frequency === 'monthly' ? parseInt(dayOfMonth) || 1 : null,
          now,
          selectedRule.id,
        ]
      );

      setShowEditModal(false);
      resetForm();
      await loadRules();
    } catch (error) {
      console.error('Failed to update rule:', error);
      Alert.alert('Error', 'Failed to update recurring expense');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleRule = async (rule: RecurringRuleRow) => {
    try {
      const db = getDatabase();
      const now = Date.now();
      const newActive = rule.is_active === 1 ? 0 : 1;

      db.runSync(
        'UPDATE recurring_rules SET is_active = ?, updated_at = ? WHERE id = ?',
        [newActive, now, rule.id]
      );

      await loadRules();
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const handleDeleteRule = async () => {
    if (!selectedRule) return;

    Alert.alert(
      'Delete Recurring Expense',
      'Are you sure you want to delete this recurring expense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsSaving(true);
            try {
              const db = getDatabase();
              db.runSync('DELETE FROM recurring_rules WHERE id = ?', [selectedRule.id]);
              setShowEditModal(false);
              resetForm();
              await loadRules();
            } catch (error) {
              console.error('Failed to delete rule:', error);
              Alert.alert('Error', 'Failed to delete recurring expense');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  const getFrequencyLabel = (freq: RecurringFrequency): string => {
    switch (freq) {
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      case 'monthly':
        return 'Monthly';
      case 'yearly':
        return 'Yearly';
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      {rules.length === 0 ? (
        <EmptyState
          icon="repeat"
          title="No recurring expenses"
          message="Add recurring expenses like rent, subscriptions, and bills to track them automatically"
          actionLabel="Add Recurring"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <ScrollView style={styles.scrollView}>
          {rules.map((rule) => {
            const category = rule.category_id ? getCategoryById(rule.category_id) : null;
            return (
              <Surface key={rule.id} style={styles.ruleCard} elevation={1}>
                <View style={styles.ruleHeader}>
                  <View style={styles.ruleInfo}>
                    <View
                      style={[
                        styles.categoryIcon,
                        {
                          backgroundColor: category?.color || Colors.textSecondary,
                          opacity: rule.is_active === 1 ? 1 : 0.5,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={(category?.icon as any) || 'repeat'}
                        size={20}
                        color="#fff"
                      />
                    </View>
                    <View style={styles.ruleText}>
                      <Text
                        style={[
                          styles.ruleName,
                          rule.is_active !== 1 && styles.inactiveText,
                        ]}
                      >
                        {rule.name}
                      </Text>
                      <Text
                        style={[
                          styles.ruleDetails,
                          rule.is_active !== 1 && styles.inactiveText,
                        ]}
                      >
                        {getFrequencyLabel(rule.frequency as RecurringFrequency)} • Next:{' '}
                        {format(new Date(rule.next_due_date), 'dd MMM')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.ruleRight}>
                    <Text
                      style={[
                        styles.ruleAmount,
                        {
                          color: rule.type === 'credit' ? Colors.income : Colors.expense,
                          opacity: rule.is_active === 1 ? 1 : 0.5,
                        },
                      ]}
                    >
                      {rule.type === 'credit' ? '+' : '-'}
                      {formatCurrency(rule.amount)}
                    </Text>
                    <Switch
                      value={rule.is_active === 1}
                      onValueChange={() => handleToggleRule(rule)}
                    />
                  </View>
                </View>
                <Button
                  mode="text"
                  onPress={() => handleEditRule(rule)}
                  style={styles.editButton}
                >
                  Edit
                </Button>
              </Surface>
            );
          })}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
        color="#fff"
      />

      {/* Add/Edit Modal */}
      <Portal>
        <Modal
          visible={showAddModal || showEditModal}
          onDismiss={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            resetForm();
          }}
          contentContainerStyle={styles.modalContent}
        >
          <ScrollView>
            <Text style={styles.modalTitle}>
              {showEditModal ? 'Edit Recurring' : 'Add Recurring Expense'}
            </Text>

            <TextInput
              mode="outlined"
              label="Name (e.g., Netflix, Rent)"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />

            <TextInput
              mode="outlined"
              label="Amount"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              left={<TextInput.Affix text="₹" />}
              style={styles.input}
            />

            <Text style={styles.label}>Type</Text>
            <SegmentedButtons
              value={type}
              onValueChange={(value) => setType(value as TransactionType)}
              buttons={[
                { value: 'debit', label: 'Expense' },
                { value: 'credit', label: 'Income' },
              ]}
              style={styles.segmentedButtons}
            />

            <Text style={styles.label}>Frequency</Text>
            <SegmentedButtons
              value={frequency}
              onValueChange={(value) => setFrequency(value as RecurringFrequency)}
              buttons={[
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'yearly', label: 'Yearly' },
              ]}
              style={styles.segmentedButtons}
            />

            {frequency === 'monthly' && (
              <TextInput
                mode="outlined"
                label="Day of Month (1-28)"
                value={dayOfMonth}
                onChangeText={setDayOfMonth}
                keyboardType="number-pad"
                style={styles.input}
              />
            )}

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
              {selectedCategory?.name || 'Select Category (optional)'}
            </Button>

            <View style={styles.modalActions}>
              {showEditModal && (
                <Button
                  mode="outlined"
                  onPress={handleDeleteRule}
                  textColor={Colors.error}
                  loading={isSaving}
                >
                  Delete
                </Button>
              )}
              <View style={styles.actionSpacer} />
              <Button
                mode="outlined"
                onPress={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={showEditModal ? handleUpdateRule : handleAddRule}
                loading={isSaving}
                disabled={!name.trim() || !amount || isSaving}
                style={styles.saveButton}
              >
                Save
              </Button>
            </View>
          </ScrollView>
        </Modal>

        {/* Category Picker */}
        <Modal
          visible={showCategoryPicker}
          onDismiss={() => setShowCategoryPicker(false)}
          contentContainerStyle={styles.pickerModalContent}
        >
          <Text style={styles.modalTitle}>Select Category</Text>
          <ScrollView style={styles.categoryList}>
            <List.Item
              title="None"
              onPress={() => {
                setCategoryId('');
                setShowCategoryPicker(false);
              }}
              left={() => (
                <View style={[styles.listCategoryIcon, { backgroundColor: Colors.textSecondary }]}>
                  <MaterialCommunityIcons name="close" size={20} color="#fff" />
                </View>
              )}
            />
            {categories
              .filter((c) => (type === 'credit' ? c.is_income === 1 : c.is_income === 0))
              .map((category) => (
                <List.Item
                  key={category.id}
                  title={category.name}
                  onPress={() => {
                    setCategoryId(category.id);
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
    padding: 16,
  },
  ruleCard: {
    borderRadius: 12,
    backgroundColor: Colors.surface,
    marginBottom: 12,
    padding: 16,
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ruleInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ruleText: {
    marginLeft: 12,
    flex: 1,
  },
  ruleName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  ruleDetails: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  ruleRight: {
    alignItems: 'flex-end',
  },
  ruleAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  inactiveText: {
    opacity: 0.5,
  },
  editButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
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
  modalContent: {
    backgroundColor: Colors.surface,
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: Colors.surface,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  categoryButton: {
    marginBottom: 16,
    justifyContent: 'flex-start',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionSpacer: {
    flex: 1,
  },
  saveButton: {
    marginLeft: 8,
  },
  pickerModalContent: {
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
});
