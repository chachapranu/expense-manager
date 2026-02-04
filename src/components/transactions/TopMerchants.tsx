import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { Colors } from '../../constants';
import { formatCurrency } from '../../utils/formatters';
import { useTransactionStore } from '../../store/useTransactionStore';
import { MarqueeText } from '../common/MarqueeText';

export function TopMerchants() {
  const { transactions, getTopMerchants } = useTransactionStore();
  const topMerchants = useMemo(() => getTopMerchants(5), [transactions]);

  if (topMerchants.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Top Merchants</Text>
      <Surface style={styles.merchantCard} elevation={1}>
        {topMerchants.map((item, index) => (
          <View
            key={item.merchant}
            style={[
              styles.merchantRow,
              index < topMerchants.length - 1 && styles.merchantRowBorder,
            ]}
          >
            <Text style={styles.merchantRank}>#{index + 1}</Text>
            <MarqueeText style={styles.merchantName}>
              {item.merchant}
            </MarqueeText>
            <Text style={styles.merchantAmount}>
              {formatCurrency(item.total)}
            </Text>
          </View>
        ))}
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 0,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  merchantCard: {
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  merchantRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  merchantRank: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    width: 30,
  },
  merchantName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  merchantAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.expense,
    marginLeft: 8,
  },
});
