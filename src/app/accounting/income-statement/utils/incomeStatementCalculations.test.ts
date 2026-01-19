/**
 * Unit tests for Income Statement Calculations
 *
 * NOTE: This file requires Jest to be configured in the project.
 * Currently the project uses Playwright for E2E testing only.
 *
 * To run these tests:
 * 1. Install Jest: npm install --save-dev jest @types/jest ts-jest
 * 2. Create jest.config.js
 * 3. Run: npm test
 *
 * For now, these calculations are tested via E2E tests in Playwright.
 */

import Decimal from 'decimal.js';
import {
  calculateMonthlyTotals,
  calculateVarianceTotal,
  extractMonthKeys,
  formatAmount,
} from './incomeStatementCalculations';
import { IncomeStatementRow } from '@/hooks/useFinancialStatement';

describe('incomeStatementCalculations', () => {
  describe('calculateMonthlyTotals', () => {
    it('should calculate correct totals for each month', () => {
      const data: IncomeStatementRow[] = [
        { AccountName: 'Account 1', acctnumber: '1001', variance: '100', '2025-01': '1000.50', '2025-02': '2000.75' },
        { AccountName: 'Account 2', acctnumber: '1002', variance: '50', '2025-01': '500.25', '2025-02': '750.00' },
      ];
      const monthKeys = ['2025-01', '2025-02'];

      const result = calculateMonthlyTotals(data, monthKeys);

      expect(result['2025-01'].toString()).toBe('1500.75');
      expect(result['2025-02'].toString()).toBe('2750.75');
    });

    it('should handle undefined data', () => {
      const result = calculateMonthlyTotals(undefined, ['2025-01']);

      expect(result['2025-01'].toString()).toBe('0');
    });

    it('should handle empty array', () => {
      const result = calculateMonthlyTotals([], ['2025-01']);

      expect(result['2025-01'].toString()).toBe('0');
    });

    it('should handle null and missing values', () => {
      const data: IncomeStatementRow[] = [
        { AccountName: 'Account 1', acctnumber: '1001', variance: null, '2025-01': null, '2025-02': '1000' },
        { AccountName: 'Account 2', acctnumber: '1002', variance: '50', '2025-01': '500' },
      ];
      const monthKeys = ['2025-01', '2025-02'];

      const result = calculateMonthlyTotals(data, monthKeys);

      expect(result['2025-01'].toString()).toBe('500');
      expect(result['2025-02'].toString()).toBe('1000');
    });
  });

  describe('calculateVarianceTotal', () => {
    it('should calculate correct variance total', () => {
      const data: IncomeStatementRow[] = [
        { AccountName: 'Account 1', acctnumber: '1001', variance: '100.50' },
        { AccountName: 'Account 2', acctnumber: '1002', variance: '50.25' },
      ];

      const result = calculateVarianceTotal(data);

      expect(result.toString()).toBe('150.75');
    });

    it('should handle undefined data', () => {
      const result = calculateVarianceTotal(undefined);

      expect(result.toString()).toBe('0');
    });

    it('should handle null variances', () => {
      const data: IncomeStatementRow[] = [
        { AccountName: 'Account 1', acctnumber: '1001', variance: null },
        { AccountName: 'Account 2', acctnumber: '1002', variance: '50' },
      ];

      const result = calculateVarianceTotal(data);

      expect(result.toString()).toBe('50');
    });
  });

  describe('extractMonthKeys', () => {
    it('should extract only month keys from data', () => {
      const data: IncomeStatementRow[] = [
        {
          row_count: 1,
          AccountName: 'Account 1',
          acctnumber: '1001',
          variance: '100',
          '2025-01': '1000',
          '2025-02': '2000',
          '2025-03': '3000',
        },
      ];

      const result = extractMonthKeys(data);

      expect(result).toEqual(['2025-01', '2025-02', '2025-03']);
      expect(result).not.toContain('row_count');
      expect(result).not.toContain('AccountName');
      expect(result).not.toContain('acctnumber');
      expect(result).not.toContain('variance');
    });

    it('should return sorted month keys', () => {
      const data: IncomeStatementRow[] = [
        {
          AccountName: 'Account 1',
          acctnumber: '1001',
          variance: '100',
          '2025-03': '3000',
          '2025-01': '1000',
          '2025-02': '2000',
        },
      ];

      const result = extractMonthKeys(data);

      expect(result).toEqual(['2025-01', '2025-02', '2025-03']);
    });

    it('should handle undefined data', () => {
      const result = extractMonthKeys(undefined);

      expect(result).toEqual([]);
    });
  });

  describe('formatAmount', () => {
    it('should format Decimal values with commas', () => {
      const result = formatAmount(new Decimal('1234567.89'));

      expect(result).toBe('1,234,567.89');
    });

    it('should return dash for zero values', () => {
      const result = formatAmount(new Decimal(0));

      expect(result).toBe('-');
    });

    it('should handle string input', () => {
      const result = formatAmount('1234.56');

      expect(result).toBe('1,234.56');
    });

    it('should handle number input', () => {
      const result = formatAmount(1234.56);

      expect(result).toBe('1,234.56');
    });
  });
});
