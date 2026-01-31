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
  List,
  Switch,
} from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants';
import { getDatabase, generateId, CategoryRuleRow } from '../../services/database';
import { useCategoryStore } from '../../store';
import { EmptyState, LoadingScreen } from '../../components/common';

export default function AutoCategorizationScreen() {
  const { categories, loadCategories, getCategoryById } = useCategoryStore();
  const [rules, setRules] = useState<CategoryRuleRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState<CategoryRuleRow | null>(null);
  const [pattern, setPattern] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadRules = async () => {
    try {
      const db = getDatabase();
      const fetchedRules = db.getAllSync<CategoryRuleRow>(
        'SELECT * FROM category_rules ORDER BY priority DESC'
      );
      setRules(fetchedRules);
    } catch (error) {
      console.error('Failed to load category rules:', error);
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
  const expenseCategories = categories.filter((c) => c.is_income === 0);

  const resetForm = () => {
    setPattern('');
    setCategoryId('');
    setSelectedRule(null);
  };

  const handleAddRule = async () => {
    if (!pattern.trim() || !categoryId) {
      Alert.alert('Error', 'Please enter a pattern and select a category');
      return;
    }

    setIsSaving(true);
    try {
      const db = getDatabase();
      const now = Date.now();
      const id = generateId();

      db.runSync(
        'INSERT INTO category_rules (id, pattern, category_id, priority, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, pattern.trim().toLowerCase(), categoryId, rules.length, 1, now, now]
      );

      setShowAddModal(false);
      resetForm();
      await loadRules();
    } catch (error) {
      console.error('Failed to add rule:', error);
      Alert.alert('Error', 'Failed to add rule');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditRule = (rule: CategoryRuleRow) => {
    setSelectedRule(rule);
    setPattern(rule.pattern);
    setCategoryId(rule.category_id);
    setShowEditModal(true);
  };

  const handleUpdateRule = async () => {
    if (!selectedRule || !pattern.trim() || !categoryId) {
      Alert.alert('Error', 'Please enter a pattern and select a category');
      return;
    }

    setIsSaving(true);
    try {
      const db = getDatabase();
      const now = Date.now();

      db.runSync(
        'UPDATE category_rules SET pattern = ?, category_id = ?, updated_at = ? WHERE id = ?',
        [pattern.trim().toLowerCase(), categoryId, now, selectedRule.id]
      );

      setShowEditModal(false);
      resetForm();
      await loadRules();
    } catch (error) {
      console.error('Failed to update rule:', error);
      Alert.alert('Error', 'Failed to update rule');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleRule = async (rule: CategoryRuleRow) => {
    try {
      const db = getDatabase();
      const now = Date.now();
      const newActive = rule.is_active === 1 ? 0 : 1;

      db.runSync(
        'UPDATE category_rules SET is_active = ?, updated_at = ? WHERE id = ?',
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
      'Delete Rule',
      'Are you sure you want to delete this categorization rule?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsSaving(true);
            try {
              const db = getDatabase();
              db.runSync('DELETE FROM category_rules WHERE id = ?', [selectedRule.id]);
              setShowEditModal(false);
              resetForm();
              await loadRules();
            } catch (error) {
              console.error('Failed to delete rule:', error);
              Alert.alert('Error', 'Failed to delete rule');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        Transactions containing these keywords will be automatically categorized
      </Text>

      {rules.length === 0 ? (
        <EmptyState
          icon="auto-fix"
          title="No custom rules"
          message="Add rules to automatically categorize transactions based on merchant or SMS keywords"
          actionLabel="Add Rule"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <ScrollView style={styles.scrollView}>
          {rules.map((rule) => {
            const category = getCategoryById(rule.category_id);
            return (
              <Surface key={rule.id} style={styles.ruleCard} elevation={1}>
                <List.Item
                  title={rule.pattern}
                  description={category?.name || 'Unknown category'}
                  onPress={() => handleEditRule(rule)}
                  left={() => (
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
                        name={(category?.icon as any) || 'shape'}
                        size={20}
                        color="#fff"
                      />
                    </View>
                  )}
                  right={() => (
                    <Switch
                      value={rule.is_active === 1}
                      onValueChange={() => handleToggleRule(rule)}
                    />
                  )}
                  titleStyle={[
                    styles.rulePattern,
                    rule.is_active !== 1 && styles.inactiveText,
                  ]}
                  descriptionStyle={rule.is_active !== 1 ? styles.inactiveText : undefined}
                />
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
          <Text style={styles.modalTitle}>
            {showEditModal ? 'Edit Rule' : 'Add Categorization Rule'}
          </Text>

          <TextInput
            mode="outlined"
            label="Keyword or merchant name"
            value={pattern}
            onChangeText={setPattern}
            style={styles.input}
            autoCapitalize="none"
          />

          <Text style={styles.hint}>
            Enter a keyword that appears in merchant names or SMS (e.g., "uber", "netflix")
          </Text>

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
              disabled={!pattern.trim() || !categoryId || isSaving}
              style={styles.saveButton}
            >
              Save
            </Button>
          </View>
        </Modal>

        {/* Category Picker */}
        <Modal
          visible={showCategoryPicker}
          onDismiss={() => setShowCategoryPicker(false)}
          contentContainerStyle={styles.pickerModalContent}
        >
          <Text style={styles.modalTitle}>Select Category</Text>
          <ScrollView style={styles.categoryList}>
            {expenseCategories.map((category) => (
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
                right={() =>
                  categoryId === category.id ? (
                    <MaterialCommunityIcons
                      name="check"
                      size={24}
                      color={Colors.primary}
                    />
                  ) : null
                }
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
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    padding: 16,
    paddingBottom: 8,
  },
  scrollView: {
    flex: 1,
    padding: 16,
    paddingTop: 8,
  },
  ruleCard: {
    borderRadius: 12,
    backgroundColor: Colors.surface,
    marginBottom: 8,
    overflow: 'hidden',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  rulePattern: {
    fontFamily: 'monospace',
  },
  inactiveText: {
    opacity: 0.5,
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
    backgroundColor: Colors.surface,
  },
  hint: {
    fontSize: 12,
    color: Colors.textSecondary,
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
