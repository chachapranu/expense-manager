import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert, ScrollView } from 'react-native';
import { Text, Surface, Button, Divider } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { useTransactionStore } from '../../store/useTransactionStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { TransactionForm } from '../../components/transactions/TransactionForm';

export default function TransactionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { deleteTransaction, updateTransaction, getTransactionById, loadTransactions } = useTransactionStore();
  const { getCategoryById, loadCategories } = useCategoryStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      await loadCategories();
      await loadTransactions();
      setIsLoading(false);
    };
    load();
  }, [id]);

  const transaction = getTransactionById(id);

  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(id);
              router.back();
            } catch (error) {
              console.error('Failed to delete transaction:', error);
              Alert.alert('Error', 'Failed to delete transaction');
            }
          },
        },
      ]
    );
  };

  const handleUpdate = async (data: {
    amount: string;
    type: 'debit' | 'credit';
    date: Date;
    merchant: string;
    notes: string;
    categoryId?: string;
  }) => {
    setIsSaving(true);
    try {
      await updateTransaction(id, {
        amount: parseFloat(data.amount),
        type: data.type,
        date: data.date,
        merchant: data.merchant || undefined,
        notes: data.notes || undefined,
        categoryId: data.categoryId,
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update transaction:', error);
      Alert.alert('Error', 'Failed to update transaction');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!transaction) {
    return (
      <View style={styles.container}>
        <Text>Transaction not found</Text>
      </View>
    );
  }

  if (isEditing) {
    return (
      <TransactionForm
        initialData={{
          amount: transaction.amount.toString(),
          type: transaction.type as 'debit' | 'credit',
          date: new Date(transaction.date),
          merchant: transaction.merchant || '',
          notes: transaction.notes || '',
          categoryId: transaction.category_id || undefined,
        }}
        onSubmit={handleUpdate}
        onCancel={() => setIsEditing(false)}
        isLoading={isSaving}
        submitLabel="Save Changes"
      />
    );
  }

  const category = transaction.category_id
    ? getCategoryById(transaction.category_id)
    : null;

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.card} elevation={1}>
        {/* Amount */}
        <View style={styles.amountSection}>
          <Text
            style={[
              styles.amount,
              {
                color:
                  transaction.type === 'credit' ? Colors.income : Colors.expense,
              },
            ]}
          >
            {transaction.type === 'credit' ? '+' : '-'}
            {formatCurrency(transaction.amount)}
          </Text>
          <View
            style={[
              styles.typeChip,
              {
                backgroundColor:
                  transaction.type === 'credit'
                    ? Colors.income
                    : Colors.expense,
              },
            ]}
          >
            <Text style={styles.typeText}>
              {transaction.type === 'credit' ? 'Income' : 'Expense'}
            </Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        {/* Details */}
        <View style={styles.detailRow}>
          <MaterialCommunityIcons
            name="store"
            size={24}
            color={Colors.textSecondary}
          />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Merchant</Text>
            <Text style={styles.detailValue}>
              {transaction.merchant || 'Not specified'}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View
            style={[
              styles.categoryIcon,
              { backgroundColor: category?.color || Colors.textSecondary },
            ]}
          >
            <MaterialCommunityIcons
              name={(category?.icon as any) || 'shape'}
              size={16}
              color="#fff"
            />
          </View>
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={styles.detailValue}>
              {category?.name || 'Uncategorized'}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <MaterialCommunityIcons
            name="calendar"
            size={24}
            color={Colors.textSecondary}
          />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>
              {formatDateTime(transaction.date)}
            </Text>
          </View>
        </View>

        {transaction.notes ? (
          <View style={styles.detailRow}>
            <MaterialCommunityIcons
              name="note-text"
              size={24}
              color={Colors.textSecondary}
            />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Notes</Text>
              <Text style={styles.detailValue}>{transaction.notes}</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.detailRow}>
          <MaterialCommunityIcons
            name={transaction.source === 'sms' ? 'message-text' : 'pencil'}
            size={24}
            color={Colors.textSecondary}
          />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Source</Text>
            <Text style={styles.detailValue}>
              {transaction.source === 'sms' ? 'SMS Auto-parsed' : 'Manual Entry'}
            </Text>
          </View>
        </View>

        {transaction.reference_number ? (
          <View style={styles.detailRow}>
            <MaterialCommunityIcons
              name="pound"
              size={24}
              color={Colors.textSecondary}
            />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Reference</Text>
              <Text style={styles.detailValue}>
                {transaction.reference_number}
              </Text>
            </View>
          </View>
        ) : null}
      </Surface>

      {/* Raw SMS */}
      {transaction.raw_sms ? (
        <Surface style={styles.card} elevation={1}>
          <Text style={styles.sectionTitle}>Original SMS</Text>
          <Text style={styles.rawSms}>{transaction.raw_sms}</Text>
        </Surface>
      ) : null}

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          mode="outlined"
          onPress={() => setIsEditing(true)}
          icon="pencil"
          style={styles.actionButton}
        >
          Edit
        </Button>
        <Button
          mode="outlined"
          onPress={handleDelete}
          icon="delete"
          textColor={Colors.error}
          style={[styles.actionButton, styles.deleteButton]}
        >
          Delete
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  card: {
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  amountSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  amount: {
    fontSize: 36,
    fontWeight: '700',
  },
  typeChip: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  categoryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
    marginLeft: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 16,
    color: Colors.text,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  rawSms: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    fontFamily: 'monospace',
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
  deleteButton: {
    borderColor: Colors.error,
  },
});
