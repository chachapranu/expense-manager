import React from 'react';
import { StyleSheet, FlatList, View, RefreshControl } from 'react-native';
import { TransactionItem } from './TransactionItem';
import { EmptyState } from '../common';
import { Colors } from '../../constants';
import type { TransactionRow } from '../../services/database';

interface TransactionListProps {
  transactions: TransactionRow[];
  refreshing?: boolean;
  onRefresh?: () => void;
  onAddPress?: () => void;
  ListHeaderComponent?: React.ReactElement;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  refreshing = false,
  onRefresh,
  onAddPress,
  ListHeaderComponent,
}) => {
  const renderItem = ({ item }: { item: TransactionRow }) => (
    <TransactionItem transaction={item} />
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
    <FlatList
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
