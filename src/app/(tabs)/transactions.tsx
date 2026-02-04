import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Searchbar, FAB, Chip, Menu, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, useThemeColors } from '../../constants';
import { useTransactionStore } from '../../store/useTransactionStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { TransactionList } from '../../components/transactions/TransactionList';
import type { TransactionType } from '../../types';

export default function TransactionsScreen() {
  const router = useRouter();
  const {
    transactions,
    isLoading,
    filter,
    loadTransactions,
    setFilter,
    clearFilter,
  } = useTransactionStore();
  const { categories, loadCategories } = useCategoryStore();

  const colors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
      loadTransactions();
    }, [])
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilter({ search: query || undefined });
  };

  const handleTypeFilter = (type: TransactionType | undefined) => {
    setFilter({ type });
    setShowTypeMenu(false);
  };

  const handleCategoryFilter = (categoryId: string | undefined) => {
    setFilter({ categoryId });
    setShowCategoryMenu(false);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    clearFilter();
  };

  const handleAddTransaction = () => {
    router.push('/transaction/add');
  };

  const hasActiveFilters = useMemo(
    () => filter.type || filter.categoryId || filter.search,
    [filter.type, filter.categoryId, filter.search]
  );

  const selectedCategory = useMemo(
    () => filter.categoryId ? categories.find((c) => c.id === filter.categoryId) : null,
    [filter.categoryId, categories]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search transactions..."
          onChangeText={handleSearch}
          value={searchQuery}
          style={styles.searchbar}
        />
      </View>

      <View style={styles.filterContainer}>
        <Menu
          visible={showTypeMenu}
          onDismiss={() => setShowTypeMenu(false)}
          anchor={
            <Chip
              mode="outlined"
              selected={!!filter.type}
              onPress={() => setShowTypeMenu(true)}
              style={styles.filterChip}
              icon={() => (
                <MaterialCommunityIcons
                  name="filter-variant"
                  size={16}
                  color={filter.type ? Colors.primary : Colors.textSecondary}
                />
              )}
            >
              {filter.type === 'debit'
                ? 'Expenses'
                : filter.type === 'credit'
                ? 'Income'
                : 'All Types'}
            </Chip>
          }
        >
          <Menu.Item onPress={() => handleTypeFilter(undefined)} title="All Types" />
          <Menu.Item onPress={() => handleTypeFilter('debit')} title="Expenses" />
          <Menu.Item onPress={() => handleTypeFilter('credit')} title="Income" />
        </Menu>

        <Menu
          visible={showCategoryMenu}
          onDismiss={() => setShowCategoryMenu(false)}
          anchor={
            <Chip
              mode="outlined"
              selected={!!filter.categoryId}
              onPress={() => setShowCategoryMenu(true)}
              style={styles.filterChip}
              icon={() =>
                selectedCategory ? (
                  <MaterialCommunityIcons
                    name={selectedCategory.icon as any}
                    size={16}
                    color={selectedCategory.color}
                  />
                ) : (
                  <MaterialCommunityIcons
                    name="shape"
                    size={16}
                    color={Colors.textSecondary}
                  />
                )
              }
            >
              {selectedCategory?.name || 'All Categories'}
            </Chip>
          }
        >
          <Menu.Item
            onPress={() => handleCategoryFilter(undefined)}
            title="All Categories"
          />
          {categories.map((category) => (
            <Menu.Item
              key={category.id}
              onPress={() => handleCategoryFilter(category.id)}
              title={category.name}
              leadingIcon={() => (
                <MaterialCommunityIcons
                  name={category.icon as any}
                  size={20}
                  color={category.color}
                />
              )}
            />
          ))}
        </Menu>

        {hasActiveFilters ? (
          <Chip
            mode="outlined"
            onPress={handleClearFilters}
            style={styles.clearChip}
            icon="close"
          >
            Clear
          </Chip>
        ) : null}
      </View>

      <TransactionList
        transactions={transactions}
        refreshing={isLoading}
        onRefresh={loadTransactions}
        onAddPress={handleAddTransaction}
        onEdit={(id) => router.push(`/transaction/${id}?edit=true`)}
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={handleAddTransaction}
        color={colors.background}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchbar: {
    backgroundColor: Colors.surface,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  clearChip: {
    marginBottom: 8,
    borderColor: Colors.error,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: Colors.primary,
  },
});
