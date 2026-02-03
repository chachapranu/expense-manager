import { getDatabase, IgnoreRuleRow } from '../../database';
import type { SmsMessage } from '../../../types';

const PROMO_SENDER_PREFIXES = ['AD-', 'VD-', 'VM-', 'VK-', 'DM-', 'MD-', 'TM-'] as const;

const PROMO_KEYWORDS = [
  'offer',
  'discount',
  'sale',
  'cashback offer',
  'limited time',
  'hurry',
  'subscribe',
  'unsubscribe',
  'reply stop',
] as const;

export class IgnoreRuleEngine {
  private rules: IgnoreRuleRow[] = [];
  private compiledRegexRules: Map<string, RegExp> = new Map();

  async loadRules(): Promise<void> {
    const db = getDatabase();
    this.rules = db.getAllSync<IgnoreRuleRow>(
      'SELECT * FROM ignore_rules WHERE is_active = 1'
    );

    // Pre-compile regex patterns
    this.compiledRegexRules.clear();
    for (const rule of this.rules) {
      if (rule.type === 'regex') {
        try {
          this.compiledRegexRules.set(rule.pattern, new RegExp(rule.pattern, 'i'));
        } catch (e) {
          console.error('Invalid regex pattern:', rule.pattern);
        }
      }
    }
  }

  shouldIgnore(sms: SmsMessage): boolean {
    const sender = sms.address.toUpperCase();
    const body = sms.body;

    for (const rule of this.rules) {
      switch (rule.type) {
        case 'sender':
          if (sender.includes(rule.pattern.toUpperCase())) {
            return true;
          }
          break;

        case 'keyword':
          if (body.toLowerCase().includes(rule.pattern.toLowerCase())) {
            return true;
          }
          break;

        case 'regex': {
          const regex = this.compiledRegexRules.get(rule.pattern);
          if (regex && regex.test(body)) {
            return true;
          }
          break;
        }
      }
    }

    return false;
  }

  // Default patterns to ignore (OTPs, promos, etc.)
  static isDefaultIgnored(sms: SmsMessage): boolean {
    const body = sms.body.toLowerCase();
    const sender = sms.address.toUpperCase();

    // Ignore OTPs
    if (
      body.includes('otp') ||
      body.includes('one time password') ||
      body.includes('verification code') ||
      body.includes('verify your')
    ) {
      return true;
    }

    // Check if body contains transaction keywords — if so, never ignore.
    // This must cover all keywords from BaseBankParser's CREDIT_KEYWORDS
    // and DEBIT_KEYWORDS to avoid filtering legitimate bank SMS from
    // senders with promotional prefixes (e.g. AD-HSBCIM, VM-AXISBK).
    const hasTransactionKeyword =
      body.includes('debited') ||
      body.includes('credited') ||
      body.includes('debit') ||
      body.includes('credit') ||
      body.includes('paid') ||
      body.includes('received') ||
      body.includes('withdrawn') ||
      body.includes('deposited') ||
      body.includes('transferred') ||
      body.includes('purchase') ||
      body.includes('payment') ||
      body.includes('salary') ||
      body.includes('sent') ||
      body.includes('charged') ||
      body.includes('deducted') ||
      body.includes('refund') ||
      body.includes('cashback') ||
      body.includes('reversed') ||
      body.includes('top-up') ||
      body.includes('autopay') ||
      body.includes('auto-pay') ||
      body.includes('inward');

    // Ignore promotional senders (but not if body looks like a transaction)
    if (!hasTransactionKeyword) {
      for (const pattern of PROMO_SENDER_PREFIXES) {
        if (sender.startsWith(pattern)) {
          return true;
        }
      }

      for (const keyword of PROMO_KEYWORDS) {
        if (body.includes(keyword)) {
          return true;
        }
      }
    }

    return false;
  }
}
