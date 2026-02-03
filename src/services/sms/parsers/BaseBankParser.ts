import type { ParsedTransaction, TransactionType } from '../../../types';

export abstract class BaseBankParser {
  abstract bankName: string;
  abstract senderPatterns: string[];

  private static readonly AMOUNT_PATTERNS: readonly RegExp[] = [
    /(?:Rs\.?|INR|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
    /(?:debited|credited|paid|received|sent|transferred)\s*(?:Rs\.?|INR|₹)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
    /(?:amount|amt)[:.]?\s*(?:Rs\.?|INR|₹)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
    /([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:debited|credited|paid|INR|Rs)/i,
  ];

  private static readonly ACCOUNT_PATTERNS: readonly RegExp[] = [
    /(?:a\/c|ac|acct|account|card)[^\d]*(\d{4,})/i,
    /(?:xx|x+)(\d{4})/i,
    /(\d{4})(?=\s*(?:debited|credited|is))/i,
  ];

  private static readonly MERCHANT_PATTERNS: readonly RegExp[] = [
    /(?:at|to|from|@)\s+([A-Za-z0-9\s&'-]+?)(?:\s+on|\s+ref|\s+txn|\s+for|\s*\.|$)/i,
    /(?:paid to|sent to|received from)\s+([A-Za-z0-9\s&'-]+?)(?:\s+on|\s+ref|\s*\.|\s+for|$)/i,
    /(?:VPA|UPI)\s*[:@]?\s*([a-zA-Z0-9._@-]+)/i,
  ];

  private static readonly BALANCE_PATTERNS: readonly RegExp[] = [
    /(?:avl\.?\s*bal|available\s*balance|avail\s*bal)[^\d]*(?:Rs\.?|INR|₹)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
    /(?:bal(?:ance)?)\s*(?:is|:)\s*(?:Rs\.?|INR|₹)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
    /(?:Rs\.?|INR|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:is your|available)/i,
  ];

  private static readonly REFERENCE_PATTERNS: readonly RegExp[] = [
    /(?:ref|txn|utr|trans)[^\d]*(\d{8,})/i,
    /(?:reference|transaction)[^\d]*(\d{8,})/i,
  ];

  private static readonly CREDIT_KEYWORDS: readonly string[] = [
    'credited',
    'received',
    'deposited',
    'credit',
    'refund',
    'cashback',
    'reversed',
    'posted',
    'added',
    'deposit',
    'inward',
    'salary',
  ];

  private static readonly DEBIT_KEYWORDS: readonly string[] = [
    'debited',
    'paid',
    'spent',
    'sent',
    'transferred',
    'withdrawn',
    'purchase',
    'debit',
    'charged',
    'deducted',
    'autopay',
    'auto-pay',
    'payment',
  ];

  canParse(sender: string): boolean {
    const normalizedSender = sender.toUpperCase();
    return this.senderPatterns.some((pattern) =>
      normalizedSender.includes(pattern.toUpperCase())
    );
  }

  abstract parse(body: string, date: Date): ParsedTransaction | null;

  protected extractAmount(body: string): number | null {
    for (const pattern of BaseBankParser.AMOUNT_PATTERNS) {
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

  protected extractTransactionType(body: string): TransactionType | null {
    const lowerBody = body.toLowerCase();

    for (const keyword of BaseBankParser.CREDIT_KEYWORDS) {
      if (lowerBody.includes(keyword)) {
        return 'credit';
      }
    }

    for (const keyword of BaseBankParser.DEBIT_KEYWORDS) {
      if (lowerBody.includes(keyword)) {
        return 'debit';
      }
    }

    // No transaction type keyword found — likely an informational SMS
    // (balance alert, EMI reminder, minimum due notice, etc.)
    return null;
  }

  protected extractAccountNumber(body: string): string | null {
    for (const pattern of BaseBankParser.ACCOUNT_PATTERNS) {
      const match = body.match(pattern);
      if (match) {
        return match[1].slice(-4);
      }
    }
    return null;
  }

  protected extractMerchant(body: string): string | null {
    for (const pattern of BaseBankParser.MERCHANT_PATTERNS) {
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

  protected extractBalance(body: string): number | null {
    for (const pattern of BaseBankParser.BALANCE_PATTERNS) {
      const match = body.match(pattern);
      if (match) {
        const balance = parseFloat(match[1].replace(/,/g, ''));
        if (balance >= 0) {
          return balance;
        }
      }
    }
    return null;
  }

  protected extractReferenceNumber(body: string): string | null {
    for (const pattern of BaseBankParser.REFERENCE_PATTERNS) {
      const match = body.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  }
}
