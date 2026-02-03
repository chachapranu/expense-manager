import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import {
  Text,
  Surface,
  FAB,
  Portal,
  Modal,
  TextInput,
  Button,
  SegmentedButtons,
  List,
  Switch,
} from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, CategoryColors } from '../../constants';
import { getDatabase, generateId, AccountRow } from '../../services/database';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingScreen } from '../../components/common/LoadingScreen';

type AccountType = 'bank' | 'credit_card' | 'wallet' | 'cash';

export default function AccountsScreen() {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountRow | null>(null);
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('bank');
  const [bankName, setBankName] = useState('');
  const [lastFourDigits, setLastFourDigits] = useState('');
  const [color, setColor] = useState(CategoryColors[0]);
  const [isDefault, setIsDefault] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadAccounts = async () => {
    try {
      const db = getDatabase();
      const fetchedAccounts = db.getAllSync<AccountRow>(
        'SELECT * FROM accounts ORDER BY name ASC'
      );
      setAccounts(fetchedAccounts);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAccounts();
    }, [])
  );

  const resetForm = () => {
    setName('');
    setAccountType('bank');
    setBankName('');
    setLastFourDigits('');
    setColor(CategoryColors[0]);
    setIsDefault(false);
    setSelectedAccount(null);
  };

  const handleAddAccount = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an account name');
      return;
    }

    setIsSaving(true);
    try {
      const db = getDatabase();
      const now = Date.now();
      const id = generateId();

      // If setting as default, unset other defaults
      if (isDefault) {
        db.runSync('UPDATE accounts SET is_default = 0 WHERE is_default = 1');
      }

      db.runSync(
        `INSERT INTO accounts (id, name, type, bank_name, last_four_digits, color, is_default, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          name.trim(),
          accountType,
          bankName.trim() || null,
          lastFourDigits.trim() || null,
          color,
          isDefault ? 1 : 0,
          now,
          now,
        ]
      );

      setShowAddModal(false);
      resetForm();
      await loadAccounts();
    } catch (error) {
      console.error('Failed to add account:', error);
      Alert.alert('Error', 'Failed to add account');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditAccount = (account: AccountRow) => {
    setSelectedAccount(account);
    setName(account.name);
    setAccountType(account.type as AccountType);
    setBankName(account.bank_name || '');
    setLastFourDigits(account.last_four_digits || '');
    setColor(account.color);
    setIsDefault(account.is_default === 1);
    setShowEditModal(true);
  };

  const handleUpdateAccount = async () => {
    if (!selectedAccount || !name.trim()) {
      Alert.alert('Error', 'Please enter an account name');
      return;
    }

    setIsSaving(true);
    try {
      const db = getDatabase();
      const now = Date.now();

      // If setting as default, unset other defaults
      if (isDefault && selectedAccount.is_default !== 1) {
        db.runSync('UPDATE accounts SET is_default = 0 WHERE is_default = 1');
      }

      db.runSync(
        `UPDATE accounts SET name = ?, type = ?, bank_name = ?, last_four_digits = ?, color = ?, is_default = ?, updated_at = ?
         WHERE id = ?`,
        [
          name.trim(),
          accountType,
          bankName.trim() || null,
          lastFourDigits.trim() || null,
          color,
          isDefault ? 1 : 0,
          now,
          selectedAccount.id,
        ]
      );

      setShowEditModal(false);
      resetForm();
      await loadAccounts();
    } catch (error) {
      console.error('Failed to update account:', error);
      Alert.alert('Error', 'Failed to update account');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedAccount) return;

    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete this account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsSaving(true);
            try {
              const db = getDatabase();
              db.runSync('DELETE FROM accounts WHERE id = ?', [selectedAccount.id]);
              setShowEditModal(false);
              resetForm();
              await loadAccounts();
            } catch (error) {
              console.error('Failed to delete account:', error);
              Alert.alert('Error', 'Failed to delete account');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'bank':
        return 'bank';
      case 'credit_card':
        return 'credit-card';
      case 'wallet':
        return 'wallet';
      case 'cash':
        return 'cash';
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      {accounts.length === 0 ? (
        <EmptyState
          icon="bank"
          title="No accounts"
          message="Add your bank accounts, credit cards, and wallets to track transactions"
          actionLabel="Add Account"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <ScrollView style={styles.scrollView}>
          {accounts.map((account) => (
            <Surface key={account.id} style={styles.accountCard} elevation={1}>
              <List.Item
                title={account.name}
                description={
                  account.last_four_digits
                    ? `****${account.last_four_digits}`
                    : account.bank_name || undefined
                }
                onPress={() => handleEditAccount(account)}
                left={() => (
                  <View style={[styles.accountIcon, { backgroundColor: account.color }]}>
                    <MaterialCommunityIcons
                      name={getAccountIcon(account.type as AccountType)}
                      size={24}
                      color="#fff"
                    />
                  </View>
                )}
                right={() => (
                  <View style={styles.accountRight}>
                    {account.is_default === 1 ? (
                      <Text style={styles.defaultBadge}>Default</Text>
                    ) : null}
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={24}
                      color={Colors.textSecondary}
                    />
                  </View>
                )}
              />
            </Surface>
          ))}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
        color="#fff"
      />

      {/* Add/Edit Modal */}
      <Portal>
        <Modal
          visible={showAddModal || showEditModal}
          onDismiss={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            resetForm();
          }}
          contentContainerStyle={styles.modalContent}
        >
          <ScrollView>
            <Text style={styles.modalTitle}>
              {showEditModal ? 'Edit Account' : 'Add Account'}
            </Text>

            <TextInput
              mode="outlined"
              label="Account Name"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />

            <Text style={styles.label}>Account Type</Text>
            <SegmentedButtons
              value={accountType}
              onValueChange={(value) => setAccountType(value as AccountType)}
              buttons={[
                { value: 'bank', label: 'Bank' },
                { value: 'credit_card', label: 'Card' },
                { value: 'wallet', label: 'Wallet' },
                { value: 'cash', label: 'Cash' },
              ]}
              style={styles.segmentedButtons}
            />

            {accountType !== 'cash' ? (
              <>
                <TextInput
                  mode="outlined"
                  label="Bank Name (optional)"
                  value={bankName}
                  onChangeText={setBankName}
                  style={styles.input}
                />

                <TextInput
                  mode="outlined"
                  label="Last 4 Digits (optional)"
                  value={lastFourDigits}
                  onChangeText={setLastFourDigits}
                  keyboardType="number-pad"
                  maxLength={4}
                  style={styles.input}
                />
              </>
            ) : null}

            <Button
              mode="outlined"
              onPress={() => setShowColorPicker(true)}
              style={styles.colorButton}
              icon={() => (
                <View style={[styles.colorPreview, { backgroundColor: color }]} />
              )}
            >
              {color}
            </Button>

            <View style={styles.defaultRow}>
              <Text style={styles.defaultLabel}>Set as default account</Text>
              <Switch value={isDefault} onValueChange={setIsDefault} />
            </View>

            <View style={styles.modalActions}>
              {showEditModal ? (
                <Button
                  mode="outlined"
                  onPress={handleDeleteAccount}
                  textColor={Colors.error}
                  loading={isSaving}
                >
                  Delete
                </Button>
              ) : null}
              <View style={styles.actionSpacer} />
              <Button
                mode="outlined"
                onPress={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={showEditModal ? handleUpdateAccount : handleAddAccount}
                loading={isSaving}
                disabled={!name.trim() || isSaving}
                style={styles.saveButton}
              >
                Save
              </Button>
            </View>
          </ScrollView>
        </Modal>

        {/* Color Picker */}
        <Modal
          visible={showColorPicker}
          onDismiss={() => setShowColorPicker(false)}
          contentContainerStyle={styles.colorPickerContent}
        >
          <Text style={styles.modalTitle}>Select Color</Text>
          <View style={styles.colorGrid}>
            {CategoryColors.map((colorOption) => (
              <Button
                key={colorOption}
                mode={color === colorOption ? 'contained' : 'outlined'}
                onPress={() => {
                  setColor(colorOption);
                  setShowColorPicker(false);
                }}
                style={[styles.colorOption, { borderColor: colorOption }]}
                labelStyle={{ color: color === colorOption ? '#fff' : colorOption }}
                buttonColor={color === colorOption ? colorOption : 'transparent'}
              >
                {' '}
              </Button>
            ))}
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  accountCard: {
    borderRadius: 12,
    backgroundColor: Colors.surface,
    marginBottom: 8,
    overflow: 'hidden',
  },
  accountIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  accountRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  defaultBadge: {
    fontSize: 12,
    color: Colors.primary,
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  bottomSpacer: {
    height: 80,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: Colors.primary,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    margin: 20,
    padding: 20,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: Colors.surface,
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  colorButton: {
    marginBottom: 16,
    justifyContent: 'flex-start',
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  defaultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  defaultLabel: {
    fontSize: 14,
    color: Colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  actionSpacer: {
    flex: 1,
  },
  saveButton: {
    marginLeft: 8,
  },
  colorPickerContent: {
    backgroundColor: Colors.surface,
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  colorOption: {
    width: 44,
    height: 44,
    margin: 4,
    borderRadius: 22,
    minWidth: 0,
    padding: 0,
  },
});
