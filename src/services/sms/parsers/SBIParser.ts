import { BaseBankParser } from './BaseBankParser';
import type { ParsedTransaction } from '../../../types';

export class SBIParser extends BaseBankParser {
  bankName = 'SBI';
  senderPatterns = ['SBIINB', 'SBIATM', 'SBI', 'SBIBANK'];

  parse(body: string, date: Date): ParsedTransaction | null {
    const amount = this.extractAmount(body);
    if (!amount) return null;

    const type = this.extractTransactionType(body);
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
