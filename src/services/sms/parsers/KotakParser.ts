import { BaseBankParser } from './BaseBankParser';
import type { ParsedTransaction } from '../../../types';

export class KotakParser extends BaseBankParser {
  bankName = 'Kotak Mahindra Bank';
  senderPatterns = ['KOTAKB', 'KOTAK', 'KOTAKBANK'];

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
      balance: this.extractBalance(body) || undefined,
      date,
      rawSms: body,
    };
  }
}
