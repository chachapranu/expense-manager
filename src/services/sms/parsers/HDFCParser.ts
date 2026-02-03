import { BaseBankParser } from './BaseBankParser';
import type { ParsedTransaction } from '../../../types';

export class HDFCParser extends BaseBankParser {
  bankName = 'HDFC Bank';
  senderPatterns = ['HDFCBK', 'HDFC', 'HDFCBANK'];

  parse(body: string, date: Date): ParsedTransaction | null {
    const amount = this.extractAmount(body);
    if (!amount) return null;

    const type = this.extractTransactionType(body);
    if (!type) return null;

    const accountLastFour = this.extractAccountNumber(body);
    const merchant = this.extractMerchant(body);
    const referenceNumber = this.extractReferenceNumber(body);

    return {
      amount,
      type,
      merchant: merchant || undefined,
      accountLastFour: accountLastFour || undefined,
      bankName: this.bankName,
      referenceNumber: referenceNumber || undefined,
      date,
      rawSms: body,
    };
  }
}
