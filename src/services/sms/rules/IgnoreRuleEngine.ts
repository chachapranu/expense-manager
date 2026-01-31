import { getDatabase, IgnoreRuleRow } from '../../database';
import type { SmsMessage } from '../../../types';

export class IgnoreRuleEngine {
  private rules: IgnoreRuleRow[] = [];

  async loadRules(): Promise<void> {
    const db = getDatabase();
    this.rules = db.getAllSync<IgnoreRuleRow>(
      'SELECT * FROM ignore_rules WHERE is_active = 1'
    );
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

        case 'regex':
          try {
            const regex = new RegExp(rule.pattern, 'i');
            if (regex.test(body)) {
              return true;
            }
          } catch (e) {
            console.error('Invalid regex pattern:', rule.pattern);
          }
          break;
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

    // Ignore promotional senders
    const promoPatterns = ['AD-', 'VD-', 'VM-', 'VK-', 'DM-', 'MD-', 'TM-'];
    for (const pattern of promoPatterns) {
      if (sender.startsWith(pattern)) {
        return true;
      }
    }

    // Ignore common promotional keywords
    const promoKeywords = [
      'offer',
      'discount',
      'sale',
      'cashback offer',
      'limited time',
      'hurry',
      'subscribe',
      'unsubscribe',
      'reply stop',
    ];

    // Only match if it looks promotional (not a transaction)
    if (!body.includes('debited') && !body.includes('credited')) {
      for (const keyword of promoKeywords) {
        if (body.includes(keyword)) {
          return true;
        }
      }
    }

    return false;
  }
}
