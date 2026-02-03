import { BaseBankParser } from './BaseBankParser';
import type { ParsedTransaction } from '../../../types';

export class AxisParser extends BaseBankParser {
  bankName = 'Axis Bank';
  senderPatterns = ['AXISBK', 'AXIS', 'AXISBANK'];

  parse(body: string, date: Date): ParsedTransaction | null {
    // Skip NEFT credit confirmations — these are outgoing confirmations,
    // the actual transaction is captured by the debit SMS
    if (/Your\s+NEFT\s+txn.+credited\s+to\s+beneficiary/i.test(body)) {
      return null;
    }

    // Try dedicated patterns first
    const result = this.tryUpiMultiline(body, date)
      || this.tryImpsNeftMultiline(body, date)
      || this.tryCardDebit(body, date)
      || this.tryUpiLiteTopup(body, date)
      || this.tryMandateDebit(body, date)
      || this.tryInterestCredit(body, date);

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
      date,
      rawSms: body,
    };
  }

  // "INR 100000.00 debited\nA/c no. XX5439\n30-01-26, 14:36:44\nUPI/P2M/603016554813/GROWW INVEST"
  // "INR 5000.00 credited\nA/c no. XX5439\n30-01-26\nUPI/P2A/123456/SENDER NAME"
  private tryUpiMultiline(body: string, date: Date): ParsedTransaction | null {
    const match = body.match(
      /INR\s+([0-9,]+(?:\.[0-9]{1,2})?)\s+(debited|credited)\s*\n\s*A\/c\s+no\.\s*XX(\d{4,})\s*\n\s*[\d-]+[,\s]*[\d:.]*\s*\n\s*UPI\/\w+\/(\d+)\/(.+)/i
    );
    if (!match) return null;

    return {
      amount: parseFloat(match[1].replace(/,/g, '')),
      type: match[2].toLowerCase() === 'credited' ? 'credit' : 'debit',
      merchant: this.cleanMerchant(match[5]),
      accountLastFour: match[3].slice(-4),
      bankName: this.bankName,
      referenceNumber: match[4],
      date,
      rawSms: body,
    };
  }

  // "Debit INR 100005.90\nAxis Bank A/c XX5439\n09-01-26 11:32:40\nIMPS/P2A/600955289090/SANJ"
  // "Credit INR 5000.00\nAxis Bank A/c XX5439\n09-01-26\nNEFT/REF/NAME"
  private tryImpsNeftMultiline(body: string, date: Date): ParsedTransaction | null {
    const match = body.match(
      /(Debit|Credit)\s+INR\s+([0-9,]+(?:\.[0-9]{1,2})?)\s*\n\s*Axis\s+Bank\s+A\/c\s+XX(\d{4,})\s*\n\s*[\d-]+[\s,]*[\d:.]*\s*\n\s*(?:IMPS|NEFT)\/\w+\/(\d+)\/(.+)/i
    );
    if (!match) return null;

    return {
      amount: parseFloat(match[2].replace(/,/g, '')),
      type: match[1].toLowerCase() === 'credit' ? 'credit' : 'debit',
      merchant: this.cleanMerchant(match[5]),
      accountLastFour: match[3].slice(-4),
      bankName: this.bankName,
      referenceNumber: match[4],
      date,
      rawSms: body,
    };
  }

  // "INR 345.00 debited from A/c no. XX725439 on HIRA SWEETS 09-01-2026 21:42:35 IST"
  private tryCardDebit(body: string, date: Date): ParsedTransaction | null {
    const match = body.match(
      /INR\s+([0-9,]+(?:\.[0-9]{1,2})?)\s+debited\s+from\s+A\/c\s+no\.\s*XX(\d{4,})\s+on\s+(.+?)\s+\d{2}-\d{2}-\d{2,4}/i
    );
    if (!match) return null;

    const ref = body.match(/(?:ref|txn)[^\d]*(\d{8,})/i);

    return {
      amount: parseFloat(match[1].replace(/,/g, '')),
      type: 'debit',
      merchant: this.cleanMerchant(match[3]),
      accountLastFour: match[2].slice(-4),
      bankName: this.bankName,
      referenceNumber: ref?.[1] || undefined,
      date,
      rawSms: body,
    };
  }

  // "UPI LITE top-up on UPI App amounting to INR 4994.00 has been successful. Ref no. 123456"
  private tryUpiLiteTopup(body: string, date: Date): ParsedTransaction | null {
    const match = body.match(
      /UPI\s+LITE\s+top-?up.*?INR\s+([0-9,]+(?:\.[0-9]{1,2})?).*?successful/i
    );
    if (!match) return null;

    const ref = body.match(/Ref\s+no\.?\s*(\d+)/i);
    const acct = body.match(/A\/c\s+(?:no\.?\s*)?(?:XX|x+)(\d{4})/i);

    return {
      amount: parseFloat(match[1].replace(/,/g, '')),
      type: 'debit',
      merchant: 'UPI LITE Top-up',
      accountLastFour: acct?.[1] || this.extractAccountNumber(body) || undefined,
      bankName: this.bankName,
      referenceNumber: ref?.[1] || undefined,
      date,
      rawSms: body,
    };
  }

  // "Your A/c has been debited towards Google Play for INR 149.00 on 14-01-26"
  private tryMandateDebit(body: string, date: Date): ParsedTransaction | null {
    const match = body.match(
      /debited\s+towards\s+(.+?)\s+for\s+INR\s+([0-9,]+(?:\.[0-9]{1,2})?)/i
    );
    if (!match) return null;

    const acct = body.match(/A\/c\s+(?:no\.?\s*)?(?:XX|x+)(\d{4})/i);
    const ref = body.match(/(?:ref|txn)[^\d]*(\d{8,})/i);

    return {
      amount: parseFloat(match[2].replace(/,/g, '')),
      type: 'debit',
      merchant: this.cleanMerchant(match[1]),
      accountLastFour: acct?.[1] || this.extractAccountNumber(body) || undefined,
      bankName: this.bankName,
      referenceNumber: ref?.[1] || undefined,
      date,
      rawSms: body,
    };
  }

  // "INR 123.45 credited to A/c no. XX5439 on 01-01-26. Info - ...Int.Pd"
  private tryInterestCredit(body: string, date: Date): ParsedTransaction | null {
    const match = body.match(
      /INR\s+([0-9,]+(?:\.[0-9]{1,2})?)\s+credited\s+to\s+A\/c\s+no\.\s*XX(\d{4,}).*?Int\.?\s*Pd/i
    );
    if (!match) return null;

    return {
      amount: parseFloat(match[1].replace(/,/g, '')),
      type: 'credit',
      merchant: 'Interest',
      accountLastFour: match[2].slice(-4),
      bankName: this.bankName,
      referenceNumber: undefined,
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
