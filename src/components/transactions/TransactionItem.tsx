import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants';
import { formatDate, formatCurrency } from '../../utils';
import { useCategoryStore } from '../../store';
import type { TransactionRow } from '../../services/database';

interface TransactionItemProps {
  transaction: TransactionRow;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
}) => {
  const router = useRouter();
  const { getCategoryById } = useCategoryStore();
  const category = transaction.category_id
    ? getCategoryById(transaction.category_id)
    : null;

  const handlePress = () => {
    router.push(`/transaction/${transaction.id}`);
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <Surface style={styles.container} elevation={1}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: category?.color || Colors.textSecondary },
          ]}
        >
          <MaterialCommunityIcons
            name={(category?.icon as any) || 'cash'}
            size={24}
            color="#fff"
          />
        </View>

        <View style={styles.content}>
          <Text style={styles.merchant} numberOfLines={1}>
            {transaction.merchant || category?.name || 'Unknown'}
          </Text>
          <Text style={styles.details} numberOfLines={1}>
            {category?.name || 'Uncategorized'} • {formatDate(transaction.date)}
          </Text>
          {transaction.notes && (
            <Text style={styles.notes} numberOfLines={1}>
              {transaction.notes}
            </Text>
          )}
        </View>

        <View style={styles.amountContainer}>
          <Text
            style={[
              styles.amount,
              {
                color:
                  transaction.type === 'credit'
                    ? Colors.income
                    : Colors.expense,
              },
            ]}
          >
            {transaction.type === 'credit' ? '+' : '-'}
            {formatCurrency(transaction.amount)}
          </Text>
          {transaction.source === 'sms' && (
            <MaterialCommunityIcons
              name="message-text"
              size={12}
              color={Colors.textSecondary}
              style={styles.sourceIcon}
            />
          )}
        </View>
      </Surface>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  merchant: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  details: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  notes: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
  },
  sourceIcon: {
    marginTop: 4,
  },
});
