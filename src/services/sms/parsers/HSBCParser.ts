import { BaseBankParser } from './BaseBankParser';
import type { ParsedTransaction } from '../../../types';

export class HSBCParser extends BaseBankParser {
  bankName = 'HSBC';
  senderPatterns = ['HSBC', 'HSBCBK', 'HSBCBANK', 'HSBCIN', 'HSBCIM'];

  parse(body: string, date: Date): ParsedTransaction | null {
    // Try dedicated patterns first
    const result = this.tryUpiPayment(body, date)
      || this.tryNeftImpsCredit(body, date)
      || this.tryUpiIncoming(body, date)
      || this.tryDebitCard(body, date)
      || this.tryAccountDebit(body, date)
      || this.tryAccountCredit(body, date);

    if (result) return result;

    // Fall back to base class extraction
    const amount = this.extractAmount(body);
    if (!amount) return null;

    const type = this.extractTransactionType(body);
    if (!type) return null;

    return {
      amount,
      type,
      merchant: this.extractMerchant(body) || undefined,
      accountLastFour: this.extractAccountNumber(body) || undefined,
      bankName: this.bankName,
      referenceNumber: this.extractReferenceNumber(body) || undefined,
      balance: this.extractBalance(body) || undefined,
      date,
      rawSms: body,
    };
  }

  // "INR 1234.00 is paid from HSBC account XXXXXX1234 to MERCHANT NAME on 01Jan..."
  private tryUpiPayment(body: string, date: Date): ParsedTransaction | null {
    const match = body.match(
      /INR\s+([0-9,]+(?:\.[0-9]{1,2})?)\s+is\s+paid\s+from\s+HSBC\s+account\s+\w*?(\d{4})\s+to\s+(.+?)\s+on\s+/i
    );
    if (!match) return null;

    const ref = body.match(/ref\s*[:#]?\s*(\d{8,})/i);

    return {
      amount: parseFloat(match[1].replace(/,/g, '')),
      type: 'debit',
      merchant: this.cleanMerchant(match[3]),
      accountLastFour: match[2],
      bankName: this.bankName,
      referenceNumber: ref?.[1] || undefined,
      balance: this.extractBalance(body) || undefined,
      date,
      rawSms: body,
    };
  }

  // "is credited with INR 18,528.62+ on 30JAN ... with UTR 1234 as NEFT from HDFC A/c ***0051 of BIRLA SUN LIFE"
  private tryNeftImpsCredit(body: string, date: Date): ParsedTransaction | null {
    const match = body.match(
      /credited\s+with\s+INR\s+([0-9,]+(?:\.[0-9]{1,2})?)\+?\s+on\s+.+?\s+with\s+UTR\s+(\w+)\s+as\s+(?:NEFT|IMPS)\s+from\s+.+?\s+of\s+(.+)/i
    );
    if (!match) return null;

    const acct = body.match(/A\/c\s+(?:no\.?\s*)?(?:XX|x+|\*+)(\d{4})/i);

    return {
      amount: parseFloat(match[1].replace(/,/g, '')),
      type: 'credit',
      merchant: this.cleanMerchant(match[3]),
      accountLastFour: acct?.[1] || this.extractAccountNumber(body) || undefined,
      bankName: this.bankName,
      referenceNumber: match[2],
      balance: this.extractBalance(body) || undefined,
      date,
      rawSms: body,
    };
  }

  // "is credited for INR 1234.00 on 01Jan from someone@upi. UPI Ref No 123456"
  private tryUpiIncoming(body: string, date: Date): ParsedTransaction | null {
    const match = body.match(
      /credited\s+for\s+INR\s+([0-9,]+(?:\.[0-9]{1,2})?)\s+on\s+.+?\s+from\s+([a-zA-Z0-9._@-]+).*?(?:UPI\s+Ref\s+No\.?\s*(\d+))?/i
    );
    if (!match) return null;

    const acct = body.match(/A\/c\s+(?:no\.?\s*)?(?:XX|x+|\*+)(\d{4})/i);

    return {
      amount: parseFloat(match[1].replace(/,/g, '')),
      type: 'credit',
      merchant: this.cleanMerchant(match[2]),
      accountLastFour: acct?.[1] || this.extractAccountNumber(body) || undefined,
      bankName: this.bankName,
      referenceNumber: match[3] || this.extractReferenceNumber(body) || undefined,
      balance: this.extractBalance(body) || undefined,
      date,
      rawSms: body,
    };
  }

  // "using HSBC Debit Card 1234 for INR 500.00 on 01Jan at MERCHANT NAME"
  private tryDebitCard(body: string, date: Date): ParsedTransaction | null {
    const match = body.match(
      /using\s+HSBC\s+Debit\s+Card\s+(\d{4})\s+for\s+INR\s+([0-9,]+(?:\.[0-9]{1,2})?)\s+on\s+.+?\s+at\s+(.+?)(?:\s*\.|$)/i
    );
    if (!match) return null;

    return {
      amount: parseFloat(match[2].replace(/,/g, '')),
      type: 'debit',
      merchant: this.cleanMerchant(match[3]),
      accountLastFour: match[1],
      bankName: this.bankName,
      referenceNumber: this.extractReferenceNumber(body) || undefined,
      balance: this.extractBalance(body) || undefined,
      date,
      rawSms: body,
    };
  }

  // "A/c XX1234 has been debited with INR 500.00- on 01Jan as SOME REASON"
  // Also handles "CSH WDL" as ATM Withdrawal
  private tryAccountDebit(body: string, date: Date): ParsedTransaction | null {
    const match = body.match(
      /debited\s+with\s+INR\s+([0-9,]+(?:\.[0-9]{1,2})?)[-\s]*on\s+.+?\s+as\s+(.+?)(?:\s*\.|$)/i
    );
    if (!match) return null;

    const acct = body.match(/A\/c\s+(?:no\.?\s*)?(?:XX|x+|\*+)(\d{4})/i);
    const reason = match[2].trim();
    const merchant = /CSH\s*WDL/i.test(reason) ? 'ATM Withdrawal' : this.cleanMerchant(reason);

    return {
      amount: parseFloat(match[1].replace(/,/g, '')),
      type: 'debit',
      merchant,
      accountLastFour: acct?.[1] || this.extractAccountNumber(body) || undefined,
      bankName: this.bankName,
      referenceNumber: this.extractReferenceNumber(body) || undefined,
      balance: this.extractBalance(body) || undefined,
      date,
      rawSms: body,
    };
  }

  // "A/c XX1234 has been credited with INR 500.00+ on 01Jan as SOME REASON"
  private tryAccountCredit(body: string, date: Date): ParsedTransaction | null {
    const match = body.match(
      /credited\s+with\s+INR\s+([0-9,]+(?:\.[0-9]{1,2})?)\+?\s+on\s+.+?\s+as\s+(.+?)(?:\s+with\s+UTR|\s*\.|$)/i
    );
    if (!match) return null;

    const acct = body.match(/A\/c\s+(?:no\.?\s*)?(?:XX|x+|\*+)(\d{4})/i);

    return {
      amount: parseFloat(match[1].replace(/,/g, '')),
      type: 'credit',
      merchant: this.cleanMerchant(match[2]),
      accountLastFour: acct?.[1] || this.extractAccountNumber(body) || undefined,
      bankName: this.bankName,
      referenceNumber: this.extractReferenceNumber(body) || undefined,
      balance: this.extractBalance(body) || undefined,
      date,
      rawSms: body,
    };
  }

  private cleanMerchant(raw: string): string {
    // Remove trailing asterisks, dots, spaces
    let merchant = raw.replace(/[\s.*]+$/, '').trim();
    // Remove leading/trailing quotes
    merchant = merchant.replace(/^["']|["']$/g, '');
    // Truncate at reasonable length
    if (merchant.length > 50) {
      merchant = merchant.substring(0, 50).trim();
    }
    return merchant || 'Unknown';
  }
}
