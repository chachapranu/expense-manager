import { AxisParser } from '../AxisParser';

const parser = new AxisParser();
const date = new Date('2026-01-30');

describe('AxisParser', () => {
  describe('canParse', () => {
    it('matches AXISBK sender', () => {
      expect(parser.canParse('AD-AXISBK-S')).toBe(true);
    });

    it('does not match HSBCIN sender', () => {
      expect(parser.canParse('JM-HSBCIN-S')).toBe(false);
    });
  });

  describe('UPI debit multiline', () => {
    it('extracts merchant from UPI/P2M format', () => {
      const body = 'INR 100000.00 debited\nA/c no. XX5439\n30-01-26, 14:36:44\nUPI/P2M/603016554813/GROWW INVEST TECH P';
      const result = parser.parse(body, date);
      expect(result).not.toBeNull();
      expect(result!.amount).toBe(100000);
      expect(result!.type).toBe('debit');
      expect(result!.merchant).toBe('GROWW INVEST TECH P');
      expect(result!.accountLastFour).toBe('5439');
      expect(result!.referenceNumber).toBe('603016554813');
    });
  });

  describe('UPI credit multiline', () => {
    it('extracts sender name from UPI credit', () => {
      const body = 'INR 5000.00 credited\nA/c no. XX5439\n28-01-26, 10:00:00\nUPI/P2A/603098765432/JOHN DOE';
      const result = parser.parse(body, date);
      expect(result).not.toBeNull();
      expect(result!.amount).toBe(5000);
      expect(result!.type).toBe('credit');
      expect(result!.merchant).toBe('JOHN DOE');
      expect(result!.accountLastFour).toBe('5439');
      expect(result!.referenceNumber).toBe('603098765432');
    });
  });

  describe('Card debit', () => {
    it('extracts merchant after "on" keyword', () => {
      const body = 'INR 345.00 debited from A/c no. XX725439 on HIRA SWEETS 09-01-2026 21:42:35 IST';
      const result = parser.parse(body, date);
      expect(result).not.toBeNull();
      expect(result!.amount).toBe(345);
      expect(result!.type).toBe('debit');
      expect(result!.merchant).toBe('HIRA SWEETS');
      expect(result!.accountLastFour).toBe('5439');
    });
  });

  describe('IMPS/NEFT multiline debit', () => {
    it('extracts name from IMPS/P2A format', () => {
      const body = 'Debit INR 100005.90\nAxis Bank A/c XX5439\n09-01-26 11:32:40\nIMPS/P2A/600955289090/SANJ';
      const result = parser.parse(body, date);
      expect(result).not.toBeNull();
      expect(result!.amount).toBe(100005.9);
      expect(result!.type).toBe('debit');
      expect(result!.merchant).toBe('SANJ');
      expect(result!.accountLastFour).toBe('5439');
      expect(result!.referenceNumber).toBe('600955289090');
    });
  });

  describe('UPI LITE top-up', () => {
    it('parses UPI LITE top-up as debit', () => {
      const body = 'UPI LITE top-up on UPI App amounting to INR 4994.00 has been successful. Ref no. 123456789';
      const result = parser.parse(body, date);
      expect(result).not.toBeNull();
      expect(result!.amount).toBe(4994);
      expect(result!.type).toBe('debit');
      expect(result!.merchant).toBe('UPI LITE Top-up');
      expect(result!.referenceNumber).toBe('123456789');
    });
  });

  describe('Mandate debit', () => {
    it('extracts merchant from "towards" pattern', () => {
      const body = 'Your A/c has been debited towards Google Play for INR 149.00 on 14-01-26';
      const result = parser.parse(body, date);
      expect(result).not.toBeNull();
      expect(result!.amount).toBe(149);
      expect(result!.type).toBe('debit');
      expect(result!.merchant).toBe('Google Play');
    });
  });

  describe('Interest credit', () => {
    it('extracts interest credit with "Interest" as merchant', () => {
      const body = 'INR 123.45 credited to A/c no. XX5439 on 01-01-26. Info - INTEREST Int.Pd';
      const result = parser.parse(body, date);
      expect(result).not.toBeNull();
      expect(result!.amount).toBe(123.45);
      expect(result!.type).toBe('credit');
      expect(result!.merchant).toBe('Interest');
      expect(result!.accountLastFour).toBe('5439');
    });
  });

  describe('NEFT credit confirmation (skip)', () => {
    it('returns null for outgoing NEFT confirmation', () => {
      const body = 'Your NEFT txn of INR 50,000.00 is credited to beneficiary SANJAY KUMAR on 15-01-26';
      const result = parser.parse(body, date);
      expect(result).toBeNull();
    });
  });

  describe('Non-transactional SMS', () => {
    it('returns null for OTP messages', () => {
      const body = 'Your Axis Bank OTP is 567890. Valid for 5 minutes.';
      const result = parser.parse(body, date);
      expect(result).toBeNull();
    });

    it('returns null for UPI mandate create notification', () => {
      const body = 'UPI mandate created successfully for NETFLIX on your Axis Bank account.';
      const result = parser.parse(body, date);
      expect(result).toBeNull();
    });
  });
});
