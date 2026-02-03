import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Platform } from 'react-native';
import {
  Text,
  Surface,
  Button,
  ProgressBar,
  SegmentedButtons,
  List,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants';
import { smsService } from '../../services/sms/SmsService';
import { useTransactionStore } from '../../store/useTransactionStore';

type SyncRange = '7' | '30' | '90';

export default function SmsSyncScreen() {
  const { loadTransactions } = useTransactionStore();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncRange, setSyncRange] = useState<SyncRange>('30');
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    errors: number;
  } | null>(null);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    if (Platform.OS !== 'android') {
      setHasPermission(false);
      return;
    }
    const has = await smsService.checkPermission();
    setHasPermission(has);
  };

  const handleRequestPermission = async () => {
    const granted = await smsService.requestPermission();
    setHasPermission(granted);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncProgress(0);
    setResult(null);

    try {
      const syncResult = await smsService.syncTransactions(
        parseInt(syncRange),
        (current, total) => {
          setSyncProgress(current / total);
        }
      );
      setResult(syncResult);
      await loadTransactions();
    } catch (error) {
      console.error('Sync error:', error);
      setResult({ imported: 0, skipped: 0, errors: 1 });
    } finally {
      setIsSyncing(false);
    }
  };

  if (Platform.OS !== 'android') {
    return (
      <View style={styles.container}>
        <Surface style={styles.card} elevation={1}>
          <MaterialCommunityIcons
            name="android"
            size={64}
            color={Colors.textSecondary}
          />
          <Text style={styles.title}>Android Only</Text>
          <Text style={styles.description}>
            SMS reading is only available on Android devices
          </Text>
        </Surface>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Permission Status */}
      <Surface style={styles.card} elevation={1}>
        <View style={styles.statusRow}>
          <MaterialCommunityIcons
            name={hasPermission ? 'check-circle' : 'alert-circle'}
            size={24}
            color={hasPermission ? Colors.income : Colors.warning}
          />
          <Text style={styles.statusText}>
            {hasPermission === null
              ? 'Checking permission...'
              : hasPermission
              ? 'SMS permission granted'
              : 'SMS permission required'}
          </Text>
        </View>
        {!hasPermission && hasPermission !== null ? (
          <Button
            mode="contained"
            onPress={handleRequestPermission}
            style={styles.permissionButton}
          >
            Grant Permission
          </Button>
        ) : null}
      </Surface>

      {/* Sync Options */}
      {hasPermission ? (
        <>
          <Surface style={styles.card} elevation={1}>
            <Text style={styles.sectionTitle}>Sync Range</Text>
            <Text style={styles.description}>
              Import transactions from SMS received in the last:
            </Text>
            <SegmentedButtons
              value={syncRange}
              onValueChange={(value) => setSyncRange(value as SyncRange)}
              buttons={[
                { value: '7', label: '7 days' },
                { value: '30', label: '30 days' },
                { value: '90', label: '90 days' },
              ]}
              style={styles.segmentedButtons}
            />

            <Button
              mode="contained"
              onPress={handleSync}
              loading={isSyncing}
              disabled={isSyncing}
              icon="sync"
              style={styles.syncButton}
            >
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>

            {isSyncing ? (
              <View style={styles.progressContainer}>
                <ProgressBar
                  progress={syncProgress}
                  color={Colors.primary}
                  style={styles.progressBar}
                />
                <Text style={styles.progressText}>
                  {Math.round(syncProgress * 100)}%
                </Text>
              </View>
            ) : null}
          </Surface>

          {/* Results */}
          {result ? (
            <Surface style={styles.card} elevation={1}>
              <Text style={styles.sectionTitle}>Sync Results</Text>
              <List.Item
                title="Imported"
                description="New transactions added"
                left={() => (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={24}
                    color={Colors.income}
                  />
                )}
                right={() => (
                  <Text style={[styles.resultCount, { color: Colors.income }]}>
                    {result.imported}
                  </Text>
                )}
              />
              <List.Item
                title="Skipped"
                description="Ignored or duplicates"
                left={() => (
                  <MaterialCommunityIcons
                    name="minus-circle"
                    size={24}
                    color={Colors.textSecondary}
                  />
                )}
                right={() => (
                  <Text style={styles.resultCount}>{result.skipped}</Text>
                )}
              />
              {result.errors > 0 ? (
                <List.Item
                  title="Errors"
                  description="Failed to process"
                  left={() => (
                    <MaterialCommunityIcons
                      name="alert-circle"
                      size={24}
                      color={Colors.error}
                    />
                  )}
                  right={() => (
                    <Text style={[styles.resultCount, { color: Colors.error }]}>
                      {result.errors}
                    </Text>
                  )}
                />
              ) : null}
            </Surface>
          ) : null}

          {/* Info */}
          <Surface style={styles.card} elevation={1}>
            <Text style={styles.sectionTitle}>Supported Banks</Text>
            <Text style={styles.description}>
              Expense Manager can parse SMS from:
            </Text>
            <View style={styles.bankList}>
              {['HDFC Bank', 'ICICI Bank', 'SBI', 'HSBC', 'Axis Bank', 'Kotak', 'Yes Bank', 'IndusInd Bank', 'Bank of Baroda', 'PNB', 'Federal Bank', 'UPI (GPay, PhonePe, Paytm)', '40+ other banks via fallback'].map(
                (bank) => (
                  <View key={bank} style={styles.bankItem}>
                    <MaterialCommunityIcons
                      name="bank"
                      size={16}
                      color={Colors.primary}
                    />
                    <Text style={styles.bankName}>{bank}</Text>
                  </View>
                )
              )}
            </View>
          </Surface>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    marginBottom: 16,
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    marginLeft: 8,
    color: Colors.text,
  },
  permissionButton: {
    marginTop: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  segmentedButtons: {
    marginBottom: 16,
    width: '100%',
  },
  syncButton: {
    width: '100%',
  },
  progressContainer: {
    width: '100%',
    marginTop: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 8,
    color: Colors.textSecondary,
  },
  resultCount: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  bankList: {
    width: '100%',
  },
  bankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  bankName: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.text,
  },
});
