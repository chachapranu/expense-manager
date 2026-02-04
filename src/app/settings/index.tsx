import React from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { List, Divider, Text, Switch } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColors } from '../../constants';
import { resetDatabase } from '../../services/database';
import { useSettingsStore } from '../../store/useSettingsStore';

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { isDarkMode, toggleDarkMode } = useSettingsStore();

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all your transactions, budgets, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetDatabase();
              Alert.alert('Success', 'All data has been reset');
            } catch (error) {
              console.error('Failed to reset database:', error);
              Alert.alert('Error', 'Failed to reset data');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <List.Section>
        <List.Subheader>Appearance</List.Subheader>
        <List.Item
          title="Dark Mode"
          description={isDarkMode ? 'On' : 'Off'}
          left={(props) => <List.Icon {...props} icon="brightness-6" />}
          right={() => (
            <Switch value={isDarkMode} onValueChange={toggleDarkMode} />
          )}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Notifications</List.Subheader>
        <List.Item
          title="Notification Alerts"
          description="Amount-based notification tiers"
          left={(props) => <List.Icon {...props} icon="bell-ring" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/settings/notifications' as any)}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>SMS Settings</List.Subheader>
        <List.Item
          title="Sync SMS"
          description="Import transactions from SMS"
          left={(props) => <List.Icon {...props} icon="message-sync" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/settings/sms-sync')}
        />
        <List.Item
          title="Ignore Rules"
          description="Manage SMS filtering rules"
          left={(props) => <List.Icon {...props} icon="filter-off" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/settings/ignore-rules')}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Categories & Accounts</List.Subheader>
        <List.Item
          title="Categories"
          description="Manage expense categories"
          left={(props) => <List.Icon {...props} icon="shape" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/settings/categories')}
        />
        <List.Item
          title="Accounts"
          description="Manage bank accounts and wallets"
          left={(props) => <List.Icon {...props} icon="bank" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/settings/accounts')}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Automation</List.Subheader>
        <List.Item
          title="Recurring Expenses"
          description="Manage recurring transactions"
          left={(props) => <List.Icon {...props} icon="repeat" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/settings/recurring')}
        />
        <List.Item
          title="Auto-Categorization"
          description="Rules for automatic categorization"
          left={(props) => <List.Icon {...props} icon="auto-fix" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/settings/auto-categorization')}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Data</List.Subheader>
        <List.Item
          title="Export Data"
          description="Export transactions to CSV"
          left={(props) => <List.Icon {...props} icon="export" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => router.push('/settings/export')}
        />
        <List.Item
          title="Reset All Data"
          description="Delete all transactions and settings"
          left={(props) => (
            <List.Icon {...props} icon="delete-forever" color={colors.error} />
          )}
          titleStyle={{ color: colors.error }}
          onPress={handleResetData}
        />
      </List.Section>

      <View style={styles.footer}>
        <Text style={[styles.version, { color: colors.textSecondary }]}>Expense Manager v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  version: {
    fontSize: 12,
  },
});
