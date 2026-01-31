import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { parsers, genericParser } from './parsers';
import { IgnoreRuleEngine } from './rules/IgnoreRuleEngine';
import { AutoCategorizer } from './rules/AutoCategorizer';
import { getDatabase, generateId, TransactionRow } from '../database';
import type { SmsMessage, ParsedTransaction } from '../../types';

// Type for react-native-get-sms-android
interface SmsAndroid {
  list: (
    filter: string,
    fail: (error: string) => void,
    success: (count: number, smsList: string) => void
  ) => void;
}

let SmsAndroidModule: SmsAndroid | null = null;

// Dynamically import SMS module only on Android
if (Platform.OS === 'android') {
  try {
    SmsAndroidModule = require('react-native-get-sms-android').default;
  } catch (e) {
    console.log('SMS module not available');
  }
}

export class SmsService {
  private ignoreRuleEngine: IgnoreRuleEngine;
  private autoCategorizer: AutoCategorizer;

  constructor() {
    this.ignoreRuleEngine = new IgnoreRuleEngine();
    this.autoCategorizer = new AutoCategorizer();
  }

  async requestPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      Alert.alert('Not Supported', 'SMS reading is only available on Android');
      return false;
    }

    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
          title: 'SMS Permission',
          message:
            'Expense Manager needs access to your SMS to automatically import transactions from bank messages.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('Permission error:', err);
      return false;
    }
  }

  async checkPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;

    try {
      const result = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_SMS
      );
      return result;
    } catch (err) {
      return false;
    }
  }

  async readSms(daysBack: number = 30): Promise<SmsMessage[]> {
    if (!SmsAndroidModule) {
      throw new Error('SMS module not available');
    }

    const hasPermission = await this.checkPermission();
    if (!hasPermission) {
      const granted = await this.requestPermission();
      if (!granted) {
        throw new Error('SMS permission denied');
      }
    }

    const minDate = Date.now() - daysBack * 24 * 60 * 60 * 1000;

    return new Promise((resolve, reject) => {
      const filter = JSON.stringify({
        box: 'inbox',
        minDate: minDate,
      });

      SmsAndroidModule!.list(
        filter,
        (fail) => {
          reject(new Error(fail));
        },
        (count, smsList) => {
          try {
            const messages: SmsMessage[] = JSON.parse(smsList);
            resolve(messages);
          } catch (e) {
            reject(new Error('Failed to parse SMS list'));
          }
        }
      );
    });
  }

  async syncTransactions(
    daysBack: number = 30,
    onProgress?: (current: number, total: number) => void
  ): Promise<{ imported: number; skipped: number; errors: number }> {
    // Load rules
    await this.ignoreRuleEngine.loadRules();
    await this.autoCategorizer.loadRules();

    // Read SMS
    const messages = await this.readSms(daysBack);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    const db = getDatabase();

    for (let i = 0; i < messages.length; i++) {
      const sms = messages[i];

      if (onProgress) {
        onProgress(i + 1, messages.length);
      }

      // Check if should be ignored
      if (
        IgnoreRuleEngine.isDefaultIgnored(sms) ||
        this.ignoreRuleEngine.shouldIgnore(sms)
      ) {
        skipped++;
        continue;
      }

      // Parse the SMS
      const parsed = this.parseSms(sms);
      if (!parsed) {
        skipped++;
        continue;
      }

      // Check for duplicates (same amount, date within 1 minute, same raw SMS)
      try {
        const existingTransactions = db.getAllSync<TransactionRow>(
          'SELECT * FROM transactions'
        );
        const isDuplicate = existingTransactions.some(
          (t: TransactionRow) =>
            t.raw_sms === parsed.rawSms ||
            (t.amount === parsed.amount &&
              Math.abs(t.date - parsed.date.getTime()) < 60000)
        );

        if (isDuplicate) {
          skipped++;
          continue;
        }

        // Auto-categorize
        const categoryId = this.autoCategorizer.categorize(
          parsed.merchant,
          parsed.rawSms
        );

        // Save transaction
        const now = Date.now();
        const id = generateId();

        db.runSync(
          `INSERT INTO transactions (id, amount, type, date, notes, merchant, category_id, account_id, source, raw_sms, reference_number, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            parsed.amount,
            parsed.type,
            parsed.date.getTime(),
            null,
            parsed.merchant || null,
            categoryId,
            null,
            'sms',
            parsed.rawSms,
            parsed.referenceNumber || null,
            now,
            now,
          ]
        );

        imported++;
      } catch (e) {
        console.error('Error saving transaction:', e);
        errors++;
      }
    }

    return { imported, skipped, errors };
  }

  private parseSms(sms: SmsMessage): ParsedTransaction | null {
    const date = new Date(sms.date);

    // Find a parser that can handle this SMS
    for (const parser of parsers) {
      if (parser.canParse(sms.address)) {
        const result = parser.parse(sms.body, date);
        if (result) {
          return result;
        }
      }
    }

    // Try generic parser as fallback
    return genericParser.parse(sms.body, date);
  }
}

// Singleton instance
export const smsService = new SmsService();
