import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import {
  TextInput,
  Button,
  SegmentedButtons,
  Text,
  Portal,
  Modal,
  List,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../../constants';
import { useCategoryStore } from '../../store';
import type { TransactionType } from '../../types';
import type { CategoryRow } from '../../services/database';

interface TransactionFormData {
  amount: string;
  type: TransactionType;
  date: Date;
  merchant: string;
  notes: string;
  categoryId?: string;
}

interface TransactionFormProps {
  initialData?: Partial<TransactionFormData>;
  onSubmit: (data: TransactionFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Save',
}) => {
  const { categories, loadCategories } = useCategoryStore();
  const [formData, setFormData] = useState<TransactionFormData>({
    amount: initialData?.amount || '',
    type: initialData?.type || 'debit',
    date: initialData?.date || new Date(),
    merchant: initialData?.merchant || '',
    notes: initialData?.notes || '',
    categoryId: initialData?.categoryId,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadCategories();
  }, []);

  const selectedCategory = formData.categoryId
    ? categories.find((c) => c.id === formData.categoryId)
    : null;

  const filteredCategories = categories.filter(
    (c) => (formData.type === 'credit' ? c.is_income === 1 : c.is_income === 0)
  );

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onSubmit(formData);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({ ...formData, date: selectedDate });
    }
  };

  const handleCategorySelect = (category: CategoryRow) => {
    setFormData({ ...formData, categoryId: category.id });
    setShowCategoryPicker(false);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <SegmentedButtons
        value={formData.type}
        onValueChange={(value) =>
          setFormData({ ...formData, type: value as TransactionType, categoryId: undefined })
        }
        buttons={[
          { value: 'debit', label: 'Expense' },
          { value: 'credit', label: 'Income' },
        ]}
        style={styles.segmentedButtons}
      />

      <TextInput
        mode="outlined"
        label="Amount"
        value={formData.amount}
        onChangeText={(text) => setFormData({ ...formData, amount: text })}
        keyboardType="decimal-pad"
        left={<TextInput.Affix text="₹" />}
        error={!!errors.amount}
        style={styles.input}
      />
      {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}

      <TextInput
        mode="outlined"
        label="Merchant / Payee"
        value={formData.merchant}
        onChangeText={(text) => setFormData({ ...formData, merchant: text })}
        style={styles.input}
      />

      <Button
        mode="outlined"
        onPress={() => setShowCategoryPicker(true)}
        style={styles.pickerButton}
        contentStyle={styles.pickerButtonContent}
        icon={() =>
          selectedCategory ? (
            <MaterialCommunityIcons
              name={selectedCategory.icon as any}
              size={20}
              color={selectedCategory.color}
            />
          ) : (
            <MaterialCommunityIcons name="shape" size={20} color={Colors.textSecondary} />
          )
        }
      >
        {selectedCategory?.name || 'Select Category'}
      </Button>

      <Button
        mode="outlined"
        onPress={() => setShowDatePicker(true)}
        style={styles.pickerButton}
        contentStyle={styles.pickerButtonContent}
        icon="calendar"
      >
        {formData.date.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}
      </Button>

      {showDatePicker && (
        <DateTimePicker
          value={formData.date}
          mode="date"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      <TextInput
        mode="outlined"
        label="Notes (optional)"
        value={formData.notes}
        onChangeText={(text) => setFormData({ ...formData, notes: text })}
        multiline
        numberOfLines={3}
        style={styles.input}
      />

      <View style={styles.buttonContainer}>
        <Button mode="outlined" onPress={onCancel} style={styles.button}>
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={isLoading}
          disabled={isLoading}
          style={styles.button}
        >
          {submitLabel}
        </Button>
      </View>

      <Portal>
        <Modal
          visible={showCategoryPicker}
          onDismiss={() => setShowCategoryPicker(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text style={styles.modalTitle}>Select Category</Text>
          <ScrollView style={styles.categoryList}>
            {filteredCategories.map((category) => (
              <List.Item
                key={category.id}
                title={category.name}
                onPress={() => handleCategorySelect(category)}
                left={() => (
                  <View
                    style={[
                      styles.categoryIcon,
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
                  formData.categoryId === category.id ? (
                    <MaterialCommunityIcons
                      name="check"
                      size={24}
                      color={Colors.primary}
                    />
                  ) : null
                }
                style={styles.categoryItem}
              />
            ))}
          </ScrollView>
        </Modal>
      </Portal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.background,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: Colors.surface,
  },
  pickerButton: {
    marginBottom: 16,
    justifyContent: 'flex-start',
  },
  pickerButtonContent: {
    justifyContent: 'flex-start',
    height: 48,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 32,
  },
  button: {
    flex: 1,
    marginHorizontal: 8,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
    marginLeft: 8,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    margin: 20,
    borderRadius: 12,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoryList: {
    maxHeight: 400,
  },
  categoryItem: {
    paddingVertical: 8,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
