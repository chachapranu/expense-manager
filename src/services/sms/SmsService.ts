import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { parsers, genericParser } from './parsers';
import { IgnoreRuleEngine } from './rules/IgnoreRuleEngine';
import { AutoCategorizer } from './rules/AutoCategorizer';
import { getDatabase, generateId, TransactionRow } from '../database';
import { BankSenderPatterns } from '../../constants';
import type { SmsMessage, ParsedTransaction } from '../../types';
import { anomalyDetector } from '../notifications/AnomalyDetector';

// Type for react-native-get-sms-android
interface SmsAndroid {
  list: (
    filter: string,
    fail: (error: string) => void,
    success: (count: number, smsList: string) => void
  ) => void;
}

let SmsAndroidModule: SmsAndroid | null = null;

function getSmsModule(): SmsAndroid | null {
  if (SmsAndroidModule) return SmsAndroidModule;
  if (Platform.OS !== 'android') return null;

  try {
    const moduleName = 'react-native-get-sms-android';
    SmsAndroidModule = require(moduleName);
  } catch (e) {
    console.log('SMS module not available');
  }
  return SmsAndroidModule;
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
    const smsModule = getSmsModule();
    if (!smsModule) {
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

      smsModule.list(
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

  async readBankSms(daysBack: number = 90): Promise<SmsMessage[]> {
    const messages = await this.readSms(daysBack);

    // Indian TRAI transactional SMS format: 2-letter circle code + "-" + 4-8 char sender
    // e.g. "JM-HDFCBK", "AD-ICICIB", "VM-HSBCBK"
    const TRAI_PATTERN = /^[A-Z]{2}-[A-Z0-9]{4,8}$/i;

    const bankPatterns = Object.values(BankSenderPatterns).flat();

    return messages.filter((sms) => {
      const sender = sms.address.toUpperCase();
      if (TRAI_PATTERN.test(sender)) return true;
      return bankPatterns.some((p) => sender.includes(p.toUpperCase()));
    });
  }

  async syncTransactions(
    daysBack: number = 30,
    onProgress?: (current: number, total: number) => void
  ): Promise<{ imported: number; skipped: number; errors: number }> {
    // Load rules in parallel
    await Promise.all([
      this.ignoreRuleEngine.loadRules(),
      this.autoCategorizer.loadRules(),
    ]);

    // Read SMS
    const messages = await this.readSms(daysBack);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    const db = getDatabase();

    // Pre-fetch all transactions once to avoid N+1 queries
    const existingTransactions = db.getAllSync<TransactionRow>(
      'SELECT * FROM transactions'
    );
    const existingRawSms = new Set(
      existingTransactions
        .map((t) => t.raw_sms)
        .filter((s): s is string => s !== null)
    );

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

      // Check for duplicates (same raw SMS or same amount+date within 1 minute)
      try {
        const isDuplicate =
          existingRawSms.has(parsed.rawSms) ||
          existingTransactions.some(
            (t: TransactionRow) =>
              t.amount === parsed.amount &&
              Math.abs(t.date - parsed.date.getTime()) < 60000
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

        // Check for anomalous spending
        anomalyDetector.checkAndNotify(
          parsed.amount,
          parsed.type,
          categoryId,
          parsed.merchant || null
        ).catch(() => {}); // Fire and forget

        // Save balance if extracted
        if (parsed.balance !== undefined) {
          try {
            const balanceId = generateId();
            const accountIdentifier = parsed.accountLastFour || parsed.bankName || 'unknown';
            db.runSync(
              `INSERT OR REPLACE INTO account_balances (id, account_id, balance, updated_at, raw_sms)
               VALUES (
                 COALESCE(
                   (SELECT id FROM account_balances WHERE account_id = ?),
                   ?
                 ),
                 ?, ?, ?, ?
               )`,
              [accountIdentifier, balanceId, accountIdentifier, parsed.balance, now, parsed.rawSms]
            );
          } catch (balanceErr) {
            // Non-critical, don't fail the transaction import
          }
        }

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
