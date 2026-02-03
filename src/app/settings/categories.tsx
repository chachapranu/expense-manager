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
  IconButton,
} from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, CategoryIcons, CategoryColors } from '../../constants';
import { useCategoryStore } from '../../store/useCategoryStore';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import type { CategoryRow } from '../../services/database';

export default function CategoriesScreen() {
  const {
    categories,
    isLoading,
    loadCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useCategoryStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryRow | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('cash');
  const [color, setColor] = useState(CategoryColors[0]);
  const [isIncome, setIsIncome] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [])
  );

  const expenseCategories = categories.filter((c) => c.is_income === 0);
  const incomeCategories = categories.filter((c) => c.is_income === 1);

  const resetForm = () => {
    setName('');
    setIcon('cash');
    setColor(CategoryColors[0]);
    setIsIncome(false);
    setSelectedCategory(null);
  };

  const handleAddCategory = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    setIsSaving(true);
    try {
      await addCategory({
        name: name.trim(),
        icon,
        color,
        isIncome,
      });
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to add category:', error);
      Alert.alert('Error', 'Failed to add category');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCategory = (category: CategoryRow) => {
    setSelectedCategory(category);
    setName(category.name);
    setIcon(category.icon);
    setColor(category.color);
    setIsIncome(category.is_income === 1);
    setShowEditModal(true);
  };

  const handleUpdateCategory = async () => {
    if (!selectedCategory || !name.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    setIsSaving(true);
    try {
      await updateCategory(selectedCategory.id, {
        name: name.trim(),
        icon,
        color,
        isIncome,
      });
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to update category:', error);
      Alert.alert('Error', 'Failed to update category');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;

    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this category? Transactions using this category will become uncategorized.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsSaving(true);
            try {
              await deleteCategory(selectedCategory.id);
              setShowEditModal(false);
              resetForm();
            } catch (error) {
              console.error('Failed to delete category:', error);
              Alert.alert('Error', 'Failed to delete category');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  const renderCategoryItem = useCallback((category: CategoryRow) => (
    <List.Item
      key={category.id}
      title={category.name}
      onPress={() => handleEditCategory(category)}
      left={() => (
        <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
          <MaterialCommunityIcons
            name={category.icon as any}
            size={20}
            color="#fff"
          />
        </View>
      )}
      right={(props) => <List.Icon {...props} icon="chevron-right" />}
      style={styles.categoryItem}
    />
  ), []);

  if (isLoading && categories.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <List.Section>
          <List.Subheader>Expense Categories</List.Subheader>
          {expenseCategories.map(renderCategoryItem)}
        </List.Section>

        <List.Section>
          <List.Subheader>Income Categories</List.Subheader>
          {incomeCategories.map(renderCategoryItem)}
        </List.Section>

        <View style={styles.bottomSpacer} />
      </ScrollView>

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
            {showEditModal ? 'Edit Category' : 'Add Category'}
          </Text>

          <TextInput
            mode="outlined"
            label="Category Name"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          <Text style={styles.label}>Type</Text>
          <SegmentedButtons
            value={isIncome ? 'income' : 'expense'}
            onValueChange={(value) => setIsIncome(value === 'income')}
            buttons={[
              { value: 'expense', label: 'Expense' },
              { value: 'income', label: 'Income' },
            ]}
            style={styles.segmentedButtons}
          />

          <Text style={styles.label}>Icon</Text>
          <Button
            mode="outlined"
            onPress={() => setShowIconPicker(true)}
            style={styles.pickerButton}
            icon={() => (
              <MaterialCommunityIcons name={icon as any} size={24} color={color} />
            )}
          >
            {icon}
          </Button>

          <Text style={styles.label}>Color</Text>
          <Button
            mode="outlined"
            onPress={() => setShowColorPicker(true)}
            style={styles.pickerButton}
            icon={() => (
              <View style={[styles.colorPreview, { backgroundColor: color }]} />
            )}
          >
            {color}
          </Button>

          <View style={styles.modalActions}>
            {showEditModal ? (
              <Button
                mode="outlined"
                onPress={handleDeleteCategory}
                textColor={Colors.error}
                loading={isSaving}
              >
                Delete
              </Button>
            ) : null}
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
              onPress={showEditModal ? handleUpdateCategory : handleAddCategory}
              loading={isSaving}
              disabled={!name.trim() || isSaving}
              style={styles.saveButton}
            >
              Save
            </Button>
          </View>
        </Modal>

        {/* Icon Picker */}
        <Modal
          visible={showIconPicker}
          onDismiss={() => setShowIconPicker(false)}
          contentContainerStyle={styles.pickerModalContent}
        >
          <Text style={styles.modalTitle}>Select Icon</Text>
          <ScrollView>
            <View style={styles.iconGrid}>
              {CategoryIcons.map((iconName) => (
                <IconButton
                  key={iconName}
                  icon={iconName}
                  size={28}
                  onPress={() => {
                    setIcon(iconName);
                    setShowIconPicker(false);
                  }}
                  style={[
                    styles.iconOption,
                    icon === iconName && styles.selectedIcon,
                  ]}
                  iconColor={icon === iconName ? Colors.primary : Colors.text}
                />
              ))}
            </View>
          </ScrollView>
        </Modal>

        {/* Color Picker */}
        <Modal
          visible={showColorPicker}
          onDismiss={() => setShowColorPicker(false)}
          contentContainerStyle={styles.pickerModalContent}
        >
          <Text style={styles.modalTitle}>Select Color</Text>
          <View style={styles.colorGrid}>
            {CategoryColors.map((colorOption) => (
              <IconButton
                key={colorOption}
                icon={color === colorOption ? 'check' : 'circle'}
                size={32}
                onPress={() => {
                  setColor(colorOption);
                  setShowColorPicker(false);
                }}
                style={[
                  styles.colorOption,
                  { backgroundColor: colorOption },
                ]}
                iconColor="#fff"
              />
            ))}
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
  categoryItem: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
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
  pickerButton: {
    marginBottom: 16,
    justifyContent: 'flex-start',
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
    padding: 20,
    borderRadius: 12,
    maxHeight: '70%',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  iconOption: {
    margin: 4,
  },
  selectedIcon: {
    backgroundColor: Colors.background,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  colorOption: {
    margin: 8,
    borderRadius: 20,
  },
});
