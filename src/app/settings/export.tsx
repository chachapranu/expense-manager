import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert, Platform } from 'react-native';
import {
  Text,
  Surface,
  Button,
  SegmentedButtons,
  Checkbox,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { File, Paths } from 'expo-file-system';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Colors } from '../../constants';
import { useTransactionStore } from '../../store/useTransactionStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { smsService } from '../../services/sms/SmsService';

type DateRange = '1M' | '3M' | '6M' | '1Y' | 'ALL';
type SmsDumpRange = '7' | '30' | '90';

export default function ExportScreen() {
  const { transactions, loadTransactions } = useTransactionStore();
  const { getCategoryById, loadCategories } = useCategoryStore();
  const [dateRange, setDateRange] = useState<DateRange>('ALL');
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeSms, setIncludeSms] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDumping, setIsDumping] = useState(false);
  const [smsDumpRange, setSmsDumpRange] = useState<SmsDumpRange>('90');

  React.useEffect(() => {
    loadCategories();
    loadTransactions();
  }, []);

  const getDateRange = (): { start: Date | null; end: Date } => {
    const now = new Date();
    const end = endOfMonth(now);

    switch (dateRange) {
      case '1M':
        return { start: startOfMonth(now), end };
      case '3M':
        return { start: startOfMonth(subMonths(now, 2)), end };
      case '6M':
        return { start: startOfMonth(subMonths(now, 5)), end };
      case '1Y':
        return { start: startOfMonth(subMonths(now, 11)), end };
      case 'ALL':
      default:
        return { start: null, end };
    }
  };

  const filterTransactions = () => {
    const { start, end } = getDateRange();

    return transactions.filter((t) => {
      if (start && t.date < start.getTime()) return false;
      if (t.date > end.getTime()) return false;
      return true;
    });
  };

  const generateCSV = (): string => {
    const filtered = filterTransactions();

    // CSV Header
    const headers = [
      'Date',
      'Type',
      'Amount',
      'Category',
      'Merchant',
      'Source',
      ...(includeNotes ? ['Notes'] : []),
      ...(includeSms ? ['Raw SMS'] : []),
    ];

    const rows = filtered.map((t) => {
      const category = t.category_id ? getCategoryById(t.category_id) : null;
      const row = [
        format(new Date(t.date), 'yyyy-MM-dd HH:mm:ss'),
        t.type === 'credit' ? 'Income' : 'Expense',
        t.amount.toString(),
        category?.name || 'Uncategorized',
        t.merchant || '',
        t.source,
        ...(includeNotes ? [t.notes || ''] : []),
        ...(includeSms ? [t.raw_sms || ''] : []),
      ];

      // Escape CSV values
      return row.map((value) => {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
    });

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const csv = generateCSV();
      const filename = `expense-manager-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      const file = new File(Paths.cache, filename);

      await file.write(csv);

      const canShare = await isAvailableAsync();
      if (canShare) {
        await shareAsync(file.uri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Transactions',
        });
      } else {
        Alert.alert('Export Complete', `File saved to: ${file.uri}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDumpSms = async () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Not Supported', 'SMS reading is only available on Android');
      return;
    }

    setIsDumping(true);

    try {
      const daysBack = parseInt(smsDumpRange, 10);
      const messages = await smsService.readBankSms(daysBack);

      if (messages.length === 0) {
        Alert.alert('No SMS Found', `No bank SMS found in the last ${daysBack} days.`);
        return;
      }

      const dumpData = messages.map((sms) => ({
        sender: sms.address,
        body: sms.body,
        date: sms.date,
      }));

      const json = JSON.stringify(dumpData, null, 2);
      const filename = `bank-sms-dump-${format(new Date(), 'yyyy-MM-dd')}.json`;
      const file = new File(Paths.cache, filename);

      await file.write(json);

      const canShare = await isAvailableAsync();
      if (canShare) {
        await shareAsync(file.uri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Raw Bank SMS',
        });
      } else {
        Alert.alert('Export Complete', `File saved to: ${file.uri}`);
      }
    } catch (error) {
      console.error('SMS dump error:', error);
      const message = error instanceof Error ? error.message : 'Failed to dump SMS';
      Alert.alert('Error', message);
    } finally {
      setIsDumping(false);
    }
  };

  const filteredCount = filterTransactions().length;

  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.card} elevation={1}>
        <Text style={styles.sectionTitle}>Date Range</Text>
        <SegmentedButtons
          value={dateRange}
          onValueChange={(value) => setDateRange(value as DateRange)}
          buttons={[
            { value: '1M', label: '1M' },
            { value: '3M', label: '3M' },
            { value: '6M', label: '6M' },
            { value: '1Y', label: '1Y' },
            { value: 'ALL', label: 'All' },
          ]}
          style={styles.segmentedButtons}
        />

        <View style={styles.countRow}>
          <MaterialCommunityIcons
            name="file-document"
            size={20}
            color={Colors.primary}
          />
          <Text style={styles.countText}>
            {filteredCount} transaction{filteredCount !== 1 ? 's' : ''} will be exported
          </Text>
        </View>
      </Surface>

      <Surface style={styles.card} elevation={1}>
        <Text style={styles.sectionTitle}>Export Options</Text>

        <View style={styles.checkboxRow}>
          <Checkbox
            status={includeNotes ? 'checked' : 'unchecked'}
            onPress={() => setIncludeNotes(!includeNotes)}
          />
          <Text style={styles.checkboxLabel}>Include notes</Text>
        </View>

        <View style={styles.checkboxRow}>
          <Checkbox
            status={includeSms ? 'checked' : 'unchecked'}
            onPress={() => setIncludeSms(!includeSms)}
          />
          <Text style={styles.checkboxLabel}>Include raw SMS text</Text>
        </View>
      </Surface>

      <Surface style={styles.card} elevation={1}>
        <Text style={styles.sectionTitle}>Export Format</Text>
        <Text style={styles.description}>
          Data will be exported as a CSV file that can be opened in Excel,
          Google Sheets, or any spreadsheet application.
        </Text>

        <View style={styles.columnsInfo}>
          <Text style={styles.columnsTitle}>Columns included:</Text>
          <Text style={styles.columnsList}>
            Date, Type, Amount, Category, Merchant, Source
            {includeNotes && ', Notes'}
            {includeSms && ', Raw SMS'}
          </Text>
        </View>
      </Surface>

      <Button
        mode="contained"
        onPress={handleExport}
        loading={isExporting}
        disabled={isExporting || filteredCount === 0}
        icon="export"
        style={styles.exportButton}
        contentStyle={styles.exportButtonContent}
      >
        {isExporting ? 'Exporting...' : 'Export to CSV'}
      </Button>

      {Platform.OS === 'android' && (
        <>
          <Surface style={styles.card} elevation={1}>
            <Text style={styles.sectionTitle}>Dump Raw SMS</Text>
            <Text style={styles.description}>
              Export all bank SMS (including unparsed messages) as a JSON file.
              Useful for improving SMS parsing and auto-categorization.
            </Text>

            <Text style={[styles.columnsTitle, { marginBottom: 8 }]}>
              Time range
            </Text>
            <SegmentedButtons
              value={smsDumpRange}
              onValueChange={(value) => setSmsDumpRange(value as SmsDumpRange)}
              buttons={[
                { value: '7', label: '7 days' },
                { value: '30', label: '30 days' },
                { value: '90', label: '90 days' },
              ]}
              style={styles.segmentedButtons}
            />
          </Surface>

          <Button
            mode="contained"
            onPress={handleDumpSms}
            loading={isDumping}
            disabled={isDumping}
            icon="message-text-outline"
            style={styles.exportButton}
            contentStyle={styles.exportButtonContent}
          >
            {isDumping ? 'Reading SMS...' : 'Dump All Bank SMS'}
          </Button>
        </>
      )}
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
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countText: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  checkboxLabel: {
    fontSize: 14,
    color: Colors.text,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  columnsInfo: {
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 8,
  },
  columnsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  columnsList: {
    fontSize: 12,
    color: Colors.text,
  },
  exportButton: {
    marginBottom: 32,
  },
  exportButtonContent: {
    height: 48,
  },
});
