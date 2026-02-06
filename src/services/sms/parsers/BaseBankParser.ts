import type { ParsedTransaction, TransactionType } from '../../../types';

export abstract class BaseBankParser {
  abstract bankName: string;
  abstract senderPatterns: string[];

  private static readonly AMOUNT_PATTERNS: readonly RegExp[] = [
    // 1. Amount directly before a transaction keyword
    /(?:Rs\.?|INR|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)\s*(?:has\s+been\s+|is\s+|was\s+)?(?:debited|credited|paid|received|sent|withdrawn|charged|deducted|transferred)/i,
    // 2. Amount directly after a transaction keyword
    /(?:debited|credited|paid|received|sent|withdrawn|charged|deducted|transferred)\s*(?:for\s+|of\s+|with\s+)?(?:Rs\.?|INR|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
    // 3. "amount/amt" prefix
    /(?:amount|amt)[:.]?\s*(?:Rs\.?|INR|₹)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
    // 4. No-space format: Rs5000withdrawn
    /(?:Rs\.?|INR|₹)(\d+(?:\.\d{1,2})?)(?=[a-zA-Z])/i,
    // 5. Generic currency prefix (fallback, skip if preceded by bal/balance)
    /(?:Rs\.?|INR|₹)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
    // 6. Amount before currency keyword
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
    'crd',
    'cdtd',
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
    'dbtd',
    'dbt',
    'wdl',
  ];

  private static readonly NON_FINAL_PATTERNS: readonly RegExp[] = [
    /\b(?:in\s*progress|pending|processing|initiated|requested|queued)\b/i,
    /\b(?:will\s+be\s+(?:debited|credited|deducted))\b/i,
    /\b(?:request\s+(?:received|submitted|placed))\b/i,
    /\b(?:transaction\s+(?:failed|declined|rejected|unsuccessful|reversed))\b/i,
    /\b(?:could\s+not\s+be\s+processed)\b/i,
    /\b(?:payment\s+(?:failed|declined|unsuccessful))\b/i,
    /\b(?:insufficient\s+(?:funds|balance))\b/i,
    /\b(?:attempt(?:ed)?\s+(?:at|on|from))\b/i,
    /\b(?:scheduled\s+(?:for|on))\b/i,
    // Due/reminder SMS
    /\b(?:(?:is\s+|amount\s+)?due\s+(?:for\s+(?:debit|payment)|on|by))\b/i,
    /\b(?:(?:minimum|min|total)\s+(?:amount\s+)?due)\b/i,
    /\b(?:(?:emi|bill|payment)\s+(?:is\s+)?due)\b/i,
    /\b(?:overdue)\b/i,
    // Post-transaction acknowledgments
    /\b(?:thank\s+you\s+for\s+(?:your\s+)?(?:payment|paying|transaction))\b/i,
    /\b(?:we\s+have\s+received\s+your\s+payment)\b/i,
    /\b(?:payment\s+received\s*[-–—]?\s*thank\s+you)\b/i,
    /\b(?:thank\s+you\s+for\s+(?:paying|settling)\s+(?:your\s+)?(?:credit\s+card|card|loan|emi|bill))\b/i,
  ];

  private static readonly OUTGOING_CONFIRMATION_PATTERNS: readonly RegExp[] = [
    /(?:NEFT|IMPS|RTGS)\s+.*?credited\s+to\s+(?:beneficiary|ben)/i,
    /fund\s+transfer\s+.*?to\s+.*?(?:is\s+)?credited/i,
    /transferred\s+to\s+.*?successfully/i,
    /(?:NEFT|IMPS|RTGS)\s+of\s+.*?to\s+.*?(?:has\s+been\s+)?credited/i,
  ];

  private static readonly MERCHANT_ALIASES: Readonly<Record<string, string>> = {
    'Swiggy Order': 'Swiggy', 'Swiggy Stores': 'Swiggy',
    'Zomato Order': 'Zomato', 'Zomato Online': 'Zomato',
    'Amazon Pay': 'Amazon', 'Amazonpay': 'Amazon',
    'Irctc Rail Connect': 'IRCTC', 'Irctc E Ticketing': 'IRCTC',
    'Gpay Merchant': 'Google Pay', 'Google Pay Merchant': 'Google Pay',
    'Phonepe Merchant': 'PhonePe',
    'Paytm Merchant': 'Paytm', 'Paytm Mall': 'Paytm',
    'Uber India': 'Uber', 'Uber Eats': 'Uber Eats',
    'Ola Money': 'Ola', 'Ola Cabs': 'Ola',
    'Bigbasket Com': 'BigBasket',
    'Flipkart Com': 'Flipkart', 'Flipkart Internet': 'Flipkart',
  };

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
          // Verify this match is not inside a balance context
          const matchIndex = body.indexOf(match[0]);
          const preceding = body.substring(Math.max(0, matchIndex - 25), matchIndex).toLowerCase();
          if (/(?:bal|balance|avl|available|avail)\s*$/.test(preceding)) continue;
          return amount;
        }
      }
    }
    return null;
  }

  protected extractTransactionType(body: string): TransactionType | null {
    const lower = body.toLowerCase();

    const STRONG_CREDIT = ['credited', 'deposited', 'refund', 'cashback', 'reversed'];
    const STRONG_DEBIT = ['debited', 'deducted', 'withdrawn', 'charged'];
    const WEAK_CREDIT = ['received', 'credit', 'posted', 'added', 'inward', 'salary', 'deposit'];
    const WEAK_DEBIT = ['paid', 'spent', 'sent', 'transferred', 'purchase', 'debit',
                        'autopay', 'auto-pay', 'payment'];

    // Find amount position as anchor for proximity scoring
    const amtMatch = lower.match(/(?:rs\.?|inr|₹)\s*[0-9,]+/);
    const amtPos = amtMatch ? lower.indexOf(amtMatch[0]) : -1;

    let creditScore = 0;
    let debitScore = 0;

    const score = (kw: string, strong: boolean): number => {
      const pos = lower.indexOf(kw);
      if (pos === -1) return 0;
      const base = strong ? 10 : 5;
      return (amtPos >= 0 && Math.abs(pos - amtPos) < 30) ? base + 3 : base;
    };

    for (const kw of STRONG_CREDIT) creditScore += score(kw, true);
    for (const kw of WEAK_CREDIT) creditScore += score(kw, false);
    for (const kw of STRONG_DEBIT) debitScore += score(kw, true);
    for (const kw of WEAK_DEBIT) debitScore += score(kw, false);

    // Abbreviations (word-boundary to avoid false matches)
    const DEBIT_ABBRS = ['dbtd', 'dbt', 'wdl', 'w/d'];
    const CREDIT_ABBRS = ['crd', 'cdtd'];
    for (const a of DEBIT_ABBRS) if (new RegExp(`\\b${a}\\b`, 'i').test(body)) debitScore += 10;
    for (const a of CREDIT_ABBRS) if (new RegExp(`\\b${a}\\b`, 'i').test(body)) creditScore += 10;

    // Contextual clues
    if (/debit\s*card/i.test(body)) debitScore += 8;
    if (/credit\s*card/i.test(body)) debitScore += 8; // card usage = debit
    if (/\bemi\b/i.test(body)) debitScore += 8;
    if (/\bATM\b/i.test(body)) debitScore += 8;
    if (/\bloan\s+disburs/i.test(body)) creditScore += 8;

    if (creditScore === 0 && debitScore === 0) return null;
    if (creditScore > debitScore) return 'credit';
    if (debitScore > creditScore) return 'debit';
    return 'debit'; // tie-break: debit is more common
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
          return this.normalizeMerchant(merchant);
        }
      }
    }
    return null;
  }

  protected isNonFinalSms(body: string): boolean {
    return BaseBankParser.NON_FINAL_PATTERNS.some(p => p.test(body));
  }

  protected isOutgoingConfirmation(body: string): boolean {
    return BaseBankParser.OUTGOING_CONFIRMATION_PATTERNS.some(p => p.test(body));
  }

  protected normalizeMerchant(raw: string): string {
    let m = raw.trim();
    m = m.replace(/@[a-zA-Z0-9]+$/, '');     // strip UPI suffix
    m = m.replace(/[_-]+/g, ' ');             // underscores/hyphens → spaces
    m = m.replace(/\s+/g, ' ');              // collapse spaces
    m = m.replace(/[*"']+/g, '');            // strip punctuation noise
    // Title case
    m = m.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    // Aliases
    return BaseBankParser.MERCHANT_ALIASES[m] || m;
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
