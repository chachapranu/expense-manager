import { HSBCParser } from '../HSBCParser';

const parser = new HSBCParser();
const date = new Date('2026-01-30');

describe('HSBCParser', () => {
  describe('canParse', () => {
    it('matches HSBCIN sender', () => {
      expect(parser.canParse('JM-HSBCIN-S')).toBe(true);
    });

    it('matches HSBCIM sender', () => {
      expect(parser.canParse('AD-HSBCIM-S')).toBe(true);
    });

    it('does not match unrelated sender', () => {
      expect(parser.canParse('AD-AXISBK-S')).toBe(false);
    });
  });

  describe('UPI payment', () => {
    it('extracts merchant, amount, account from UPI paid SMS', () => {
      const body = 'INR 1,500.00 is paid from HSBC account XXXXXX1234 to SWIGGY on 30Jan with ref 603012345678';
      const result = parser.parse(body, date);
      expect(result).not.toBeNull();
      expect(result!.amount).toBe(1500);
      expect(result!.type).toBe('debit');
      expect(result!.merchant).toBe('SWIGGY');
      expect(result!.accountLastFour).toBe('1234');
      expect(result!.referenceNumber).toBe('603012345678');
    });
  });

  describe('NEFT/IMPS credit', () => {
    it('extracts name from NEFT credit with UTR', () => {
      const body = 'HSBC: A/c XX1234 is credited with INR 18,528.62+ on 30JAN at 19.56.03 with UTR HDFCR52026013000 as NEFT from HDFC A/c ***0051 of BIRLA SUN LIFE INSURANCE';
      const result = parser.parse(body, date);
      expect(result).not.toBeNull();
      expect(result!.amount).toBe(18528.62);
      expect(result!.type).toBe('credit');
      expect(result!.merchant).toBe('BIRLA SUN LIFE INSURANCE');
      expect(result!.referenceNumber).toBe('HDFCR52026013000');
    });
  });

  describe('UPI incoming credit', () => {
    it('extracts UPI ID as merchant', () => {
      const body = 'HSBC: A/c XX1234 is credited for INR 5,000.00 on 15Jan from sender@oksbi. UPI Ref No 603098765432';
      const result = parser.parse(body, date);
      expect(result).not.toBeNull();
      expect(result!.amount).toBe(5000);
      expect(result!.type).toBe('credit');
      expect(result!.merchant).toBe('sender@oksbi');
      expect(result!.referenceNumber).toBe('603098765432');
    });
  });

  describe('Debit card', () => {
    it('extracts merchant after "at"', () => {
      const body = 'Transaction using HSBC Debit Card 5678 for INR 999.00 on 20Jan at AMAZON RETAIL INDIA.';
      const result = parser.parse(body, date);
      expect(result).not.toBeNull();
      expect(result!.amount).toBe(999);
      expect(result!.type).toBe('debit');
      expect(result!.merchant).toBe('AMAZON RETAIL INDIA');
      expect(result!.accountLastFour).toBe('5678');
    });
  });

  describe('Account debit', () => {
    it('extracts reason as merchant', () => {
      const body = 'HSBC: A/c XX1234 has been debited with INR 2,500.00- on 10Jan as BILL PAYMENT';
      const result = parser.parse(body, date);
      expect(result).not.toBeNull();
      expect(result!.amount).toBe(2500);
      expect(result!.type).toBe('debit');
      expect(result!.merchant).toBe('BILL PAYMENT');
    });

    it('maps CSH WDL to ATM Withdrawal', () => {
      const body = 'HSBC: A/c XX1234 has been debited with INR 10,000.00- on 10Jan as CSH WDL';
      const result = parser.parse(body, date);
      expect(result).not.toBeNull();
      expect(result!.amount).toBe(10000);
      expect(result!.type).toBe('debit');
      expect(result!.merchant).toBe('ATM Withdrawal');
    });
  });

  describe('Account credit', () => {
    it('extracts reason as merchant', () => {
      const body = 'HSBC: A/c XX1234 has been credited with INR 50,000.00+ on 01Jan as SALARY JAN 2026.';
      const result = parser.parse(body, date);
      expect(result).not.toBeNull();
      expect(result!.amount).toBe(50000);
      expect(result!.type).toBe('credit');
      expect(result!.merchant).toBe('SALARY JAN 2026');
    });
  });

  describe('Non-transactional SMS', () => {
    it('returns null for OTP messages', () => {
      const body = 'Your OTP for HSBC net banking is 123456. Do not share.';
      const result = parser.parse(body, date);
      expect(result).toBeNull();
    });

    it('returns null for maintenance alerts', () => {
      const body = 'HSBC Internet Banking will be under scheduled maintenance on 15Jan from 2AM to 5AM.';
      const result = parser.parse(body, date);
      expect(result).toBeNull();
    });
  });
});
