import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Colors } from '../../constants';
import { formatCurrency } from '../../utils';
import type { TransactionType } from '../../types';

interface AmountDisplayProps {
  amount: number;
  type?: TransactionType;
  size?: 'small' | 'medium' | 'large';
  showSign?: boolean;
}

export const AmountDisplay: React.FC<AmountDisplayProps> = ({
  amount,
  type,
  size = 'medium',
  showSign = true,
}) => {
  const color =
    type === 'credit'
      ? Colors.income
      : type === 'debit'
      ? Colors.expense
      : Colors.text;

  const sign = showSign && type ? (type === 'credit' ? '+' : '-') : '';

  const fontSize =
    size === 'small' ? 14 : size === 'medium' ? 18 : 24;

  return (
    <Text style={[styles.amount, { color, fontSize }]}>
      {sign}
      {formatCurrency(amount)}
    </Text>
  );
};

const styles = StyleSheet.create({
  amount: {
    fontWeight: '600',
  },
});
