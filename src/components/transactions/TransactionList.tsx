import React, { useCallback } from 'react';
import { StyleSheet, View, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { TransactionItem } from './TransactionItem';
import { EmptyState } from '../common/EmptyState';
import { Colors } from '../../constants';
import { useTransactionStore } from '../../store/useTransactionStore';
import type { TransactionRow } from '../../services/database';

interface TransactionListProps {
  transactions: TransactionRow[];
  refreshing?: boolean;
  onRefresh?: () => void;
  onAddPress?: () => void;
  onChangeCategory?: (id: string) => void;
  ListHeaderComponent?: React.ReactElement;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  refreshing = false,
  onRefresh,
  onAddPress,
  onChangeCategory,
  ListHeaderComponent,
}) => {
  const { deleteTransaction } = useTransactionStore();

  const handleDelete = useCallback(async (id: string) => {
    await deleteTransaction(id);
  }, [deleteTransaction]);

  const renderItem = useCallback(
    ({ item }: { item: TransactionRow }) => (
      <TransactionItem
        transaction={item}
        onDelete={handleDelete}
        onChangeCategory={onChangeCategory}
      />
    ),
    [handleDelete, onChangeCategory]
  );

  if (transactions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        {ListHeaderComponent}
        <EmptyState
          icon="receipt"
          title="No transactions yet"
          message="Start tracking your expenses by adding your first transaction"
          actionLabel="Add Transaction"
          onAction={onAddPress}
        />
      </View>
    );
  }

  return (
    <FlashList
      data={transactions}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={ListHeaderComponent}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
          />
        ) : undefined
      }
    />
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingVertical: 8,
  },
});
