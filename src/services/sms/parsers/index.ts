import { BaseBankParser } from './BaseBankParser';
import { HDFCParser } from './HDFCParser';
import { ICICIParser } from './ICICIParser';
import { SBIParser } from './SBIParser';
import { UPIParser } from './UPIParser';

export { BaseBankParser } from './BaseBankParser';
export { HDFCParser } from './HDFCParser';
export { ICICIParser } from './ICICIParser';
export { SBIParser } from './SBIParser';
export { UPIParser } from './UPIParser';

// All available parsers
export const parsers: BaseBankParser[] = [
  new HDFCParser(),
  new ICICIParser(),
  new SBIParser(),
  new UPIParser(),
];

// Generic fallback parser
export class GenericParser extends BaseBankParser {
  bankName = 'Unknown';
  senderPatterns: string[] = [];

  canParse(_sender: string): boolean {
    return true; // Always matches as fallback
  }

  parse(body: string, date: Date) {
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

export const genericParser = new GenericParser();
