import React, { useState } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { TransactionForm } from '../../components/transactions/TransactionForm';
import { useTransactionStore } from '../../store/useTransactionStore';

export default function AddTransactionScreen() {
  const router = useRouter();
  const { addTransaction } = useTransactionStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: {
    amount: string;
    type: 'debit' | 'credit';
    date: Date;
    merchant: string;
    notes: string;
    categoryId?: string;
  }) => {
    setIsLoading(true);
    try {
      await addTransaction({
        amount: parseFloat(data.amount),
        type: data.type,
        date: data.date,
        merchant: data.merchant || undefined,
        notes: data.notes || undefined,
        categoryId: data.categoryId,
        source: 'manual',
      });
      router.back();
    } catch (error) {
      console.error('Failed to add transaction:', error);
      Alert.alert('Error', 'Failed to add transaction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <TransactionForm
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isLoading={isLoading}
      submitLabel="Add Transaction"
    />
  );
}
