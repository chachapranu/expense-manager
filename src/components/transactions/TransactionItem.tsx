import React, { useRef } from 'react';
import { StyleSheet, View, Pressable, Alert, Animated } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { useCategoryStore } from '../../store/useCategoryStore';
import type { TransactionRow } from '../../services/database';

interface TransactionItemProps {
  transaction: TransactionRow;
  onDelete?: (id: string) => void;
  onChangeCategory?: (id: string) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = React.memo(({
  transaction,
  onDelete,
  onChangeCategory,
}) => {
  const router = useRouter();
  const { getCategoryById } = useCategoryStore();
  const swipeableRef = useRef<Swipeable>(null);
  const category = transaction.category_id
    ? getCategoryById(transaction.category_id)
    : null;

  const handlePress = () => {
    router.push(`/transaction/${transaction.id}`);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => swipeableRef.current?.close(),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete?.(transaction.id);
          },
        },
      ]
    );
  };

  const handleChangeCategory = () => {
    swipeableRef.current?.close();
    onChangeCategory?.(transaction.id);
  };

  const renderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });

    return (
      <Pressable onPress={handleDelete} style={styles.deleteAction}>
        <Animated.View style={[styles.actionContent, { transform: [{ scale }] }]}>
          <MaterialCommunityIcons name="delete" size={24} color="#fff" />
          <Text style={styles.actionText}>Delete</Text>
        </Animated.View>
      </Pressable>
    );
  };

  const renderLeftActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [0, 80],
      outputRange: [0.5, 1],
      extrapolate: 'clamp',
    });

    return (
      <Pressable onPress={handleChangeCategory} style={styles.categoryAction}>
        <Animated.View style={[styles.actionContent, { transform: [{ scale }] }]}>
          <MaterialCommunityIcons name="shape" size={24} color="#fff" />
          <Text style={styles.actionText}>Category</Text>
        </Animated.View>
      </Pressable>
    );
  };

  const content = (
    <Pressable onPress={handlePress}>
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
          {transaction.notes ? (
            <Text style={styles.notes} numberOfLines={1}>
              {transaction.notes}
            </Text>
          ) : null}
        </View>

        <View style={styles.amountContainer}>
          <Text
            style={[
              styles.amount,
              {
                color:
                  transaction.type === 'credit'
                    ? Colors.text
                    : Colors.textSecondary,
                fontWeight:
                  transaction.type === 'credit' ? '700' : '400',
              },
            ]}
          >
            {transaction.type === 'credit' ? '+' : '-'}
            {formatCurrency(transaction.amount)}
          </Text>
          {transaction.source === 'sms' ? (
            <MaterialCommunityIcons
              name="message-text"
              size={12}
              color={Colors.textSecondary}
              style={styles.sourceIcon}
            />
          ) : null}
        </View>
      </Surface>
    </Pressable>
  );

  if (onDelete || onChangeCategory) {
    return (
      <Swipeable
        ref={swipeableRef}
        renderRightActions={onDelete ? renderRightActions : undefined}
        renderLeftActions={onChangeCategory ? renderLeftActions : undefined}
        overshootRight={false}
        overshootLeft={false}
      >
        {content}
      </Swipeable>
    );
  }

  return content;
});

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
  deleteAction: {
    backgroundColor: '#D32F2F',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginVertical: 4,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  categoryAction: {
    backgroundColor: '#555555',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginVertical: 4,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  actionContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
