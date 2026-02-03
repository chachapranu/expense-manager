import { getTransactionInfo } from 'transaction-sms-parser';
import { BaseBankParser } from './BaseBankParser';
import { HDFCParser } from './HDFCParser';
import { ICICIParser } from './ICICIParser';
import { SBIParser } from './SBIParser';
import { HSBCParser } from './HSBCParser';
import { AxisParser } from './AxisParser';
import { KotakParser } from './KotakParser';
import { YesBankParser } from './YesBankParser';
import { IndusIndParser } from './IndusIndParser';
import { BOBParser } from './BOBParser';
import { PNBParser } from './PNBParser';
import { FederalBankParser } from './FederalBankParser';
import { UPIParser } from './UPIParser';

export { BaseBankParser } from './BaseBankParser';
export { HDFCParser } from './HDFCParser';
export { ICICIParser } from './ICICIParser';
export { SBIParser } from './SBIParser';
export { HSBCParser } from './HSBCParser';
export { AxisParser } from './AxisParser';
export { KotakParser } from './KotakParser';
export { YesBankParser } from './YesBankParser';
export { IndusIndParser } from './IndusIndParser';
export { BOBParser } from './BOBParser';
export { PNBParser } from './PNBParser';
export { FederalBankParser } from './FederalBankParser';
export { UPIParser } from './UPIParser';

// All available parsers
// Bank-specific parsers before UPI since some bank SMS contain "UPI" in body but sender is bank-specific
export const parsers: BaseBankParser[] = [
  new HDFCParser(),
  new ICICIParser(),
  new SBIParser(),
  new HSBCParser(),
  new AxisParser(),
  new KotakParser(),
  new YesBankParser(),
  new IndusIndParser(),
  new BOBParser(),
  new PNBParser(),
  new FederalBankParser(),
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
    // Try our own extraction first
    const amount = this.extractAmount(body);
    const type = amount ? this.extractTransactionType(body) : null;

    if (amount && type) {
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

    // Fallback to transaction-sms-parser
    const info = getTransactionInfo(body);
    if (!info.transaction.type || !info.transaction.amount) {
      return null; // Informational SMS — skip
    }

    return {
      amount: parseFloat(info.transaction.amount.replace(/,/g, '')),
      type: info.transaction.type as 'debit' | 'credit',
      merchant: info.transaction.merchant || undefined,
      accountLastFour: info.account.number?.slice(-4) || undefined,
      bankName: info.account.name || 'Unknown',
      referenceNumber: info.transaction.referenceNo || undefined,
      date,
      rawSms: body,
    };
  }
}

export const genericParser = new GenericParser();
