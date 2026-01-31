import type { ParsedTransaction, TransactionType } from '../../../types';

export abstract class BaseBankParser {
  abstract bankName: string;
  abstract senderPatterns: string[];

  canParse(sender: string): boolean {
    const normalizedSender = sender.toUpperCase();
    return this.senderPatterns.some((pattern) =>
      normalizedSender.includes(pattern.toUpperCase())
    );
  }

  abstract parse(body: string, date: Date): ParsedTransaction | null;

  protected extractAmount(body: string): number | null {
    // Common patterns for amount extraction
    const patterns = [
      /(?:Rs\.?|INR|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
      /(?:debited|credited|paid|received|sent|transferred)\s*(?:Rs\.?|INR|₹)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
      /(?:amount|amt)[:.]?\s*(?:Rs\.?|INR|₹)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
      /([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:debited|credited|paid|INR|Rs)/i,
    ];

    for (const pattern of patterns) {
      const match = body.match(pattern);
      if (match) {
        const amount = parseFloat(match[1].replace(/,/g, ''));
        if (amount > 0) {
          return amount;
        }
      }
    }
    return null;
  }

  protected extractTransactionType(body: string): TransactionType {
    const lowerBody = body.toLowerCase();
    const creditKeywords = [
      'credited',
      'received',
      'deposited',
      'credit',
      'refund',
      'cashback',
      'reversed',
    ];
    const debitKeywords = [
      'debited',
      'paid',
      'spent',
      'sent',
      'transferred',
      'withdrawn',
      'purchase',
      'debit',
    ];

    for (const keyword of creditKeywords) {
      if (lowerBody.includes(keyword)) {
        return 'credit';
      }
    }

    for (const keyword of debitKeywords) {
      if (lowerBody.includes(keyword)) {
        return 'debit';
      }
    }

    // Default to debit for unknown
    return 'debit';
  }

  protected extractAccountNumber(body: string): string | null {
    // Extract last 4 digits of account number
    const patterns = [
      /(?:a\/c|ac|acct|account|card)[^\d]*(\d{4,})/i,
      /(?:xx|x+)(\d{4})/i,
      /(\d{4})(?=\s*(?:debited|credited|is))/i,
    ];

    for (const pattern of patterns) {
      const match = body.match(pattern);
      if (match) {
        return match[1].slice(-4);
      }
    }
    return null;
  }

  protected extractMerchant(body: string): string | null {
    // Common patterns for merchant extraction
    const patterns = [
      /(?:at|to|from|@)\s+([A-Za-z0-9\s&'-]+?)(?:\s+on|\s+ref|\s+txn|\s+for|\s*\.|$)/i,
      /(?:paid to|sent to|received from)\s+([A-Za-z0-9\s&'-]+?)(?:\s+on|\s+ref|\s*\.|\s+for|$)/i,
      /(?:VPA|UPI)\s*[:@]?\s*([a-zA-Z0-9._@-]+)/i,
    ];

    for (const pattern of patterns) {
      const match = body.match(pattern);
      if (match && match[1]) {
        const merchant = match[1].trim();
        if (merchant.length > 2 && merchant.length < 50) {
          return merchant;
        }
      }
    }
    return null;
  }

  protected extractReferenceNumber(body: string): string | null {
    const patterns = [
      /(?:ref|txn|utr|trans)[^\d]*(\d{8,})/i,
      /(?:reference|transaction)[^\d]*(\d{8,})/i,
    ];

    for (const pattern of patterns) {
      const match = body.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  }
}
