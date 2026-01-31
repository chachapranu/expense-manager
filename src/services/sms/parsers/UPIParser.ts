import { BaseBankParser } from './BaseBankParser';
import type { ParsedTransaction } from '../../../types';

export class UPIParser extends BaseBankParser {
  bankName = 'UPI';
  senderPatterns = ['GPAY', 'PHONEPE', 'PAYTM', 'BHIM', 'AMAZON', 'UPI'];

  parse(body: string, date: Date): ParsedTransaction | null {
    const amount = this.extractAmount(body);
    if (!amount) return null;

    const type = this.extractTransactionType(body);
    const merchant = this.extractUPIMerchant(body) || this.extractMerchant(body);
    const referenceNumber = this.extractReferenceNumber(body);

    // Extract VPA
    const vpaMatch = body.match(/(?:to|from)\s+([a-zA-Z0-9._-]+@[a-zA-Z]+)/i);
    const vpa = vpaMatch ? vpaMatch[1] : undefined;

    return {
      amount,
      type,
      merchant: merchant || vpa || undefined,
      bankName: this.extractBankFromVPA(vpa) || 'UPI',
      referenceNumber: referenceNumber || undefined,
      date,
      rawSms: body,
    };
  }

  private extractUPIMerchant(body: string): string | null {
    // UPI specific patterns
    const patterns = [
      /(?:paid to|sent to|received from)\s+([A-Za-z0-9\s&'-]+?)(?:\s+on|\s+ref|\s*\.|$)/i,
      /(?:to|from)\s+([A-Za-z0-9\s&'-]+?)\s+(?:on|ref|UPI)/i,
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

  private extractBankFromVPA(vpa: string | undefined): string | null {
    if (!vpa) return null;

    const bankMappings: Record<string, string> = {
      '@okhdfcbank': 'HDFC Bank',
      '@okicici': 'ICICI Bank',
      '@oksbi': 'SBI',
      '@okaxis': 'Axis Bank',
      '@paytm': 'Paytm',
      '@ybl': 'PhonePe',
      '@ibl': 'ICICI Bank',
      '@axl': 'Axis Bank',
    };

    const lowerVpa = vpa.toLowerCase();
    for (const [pattern, bank] of Object.entries(bankMappings)) {
      if (lowerVpa.includes(pattern)) {
        return bank;
      }
    }
    return null;
  }
}
