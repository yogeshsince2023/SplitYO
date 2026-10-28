import { describe, it, expect } from 'vitest';
import {
  calculateEqualSplit,
  calculatePercentageSplit,
  calculateSharesSplit,
  calculateItemizedSplit,
  calculateNetBalances,
  calculateBalancesByCurrency,
  simplifyDebts,
  formatMoney,
  parseMoneyToMinor,
  validateSplits,
} from './expenseEngine';
import { Expense, Settlement } from '../types';

describe('expenseEngine', () => {
  describe('formatMoney & parseMoneyToMinor', () => {
    it('formats INR correctly with symbol and decimals', () => {
      expect(formatMoney(105050, 'INR')).toBe('₹1,050.50');
      expect(formatMoney(-2500, 'INR')).toBe('-₹25.00');
      expect(formatMoney(0, 'INR')).toBe('₹0.00');
    });

    it('formats EUR and USD correctly', () => {
      expect(formatMoney(4500, 'USD')).toBe('$45.00');
      expect(formatMoney(1200, 'EUR')).toBe('€12.00');
    });

    it('formats JPY without fractional decimals', () => {
      expect(formatMoney(5000, 'JPY')).toBe('¥5,000');
    });

    it('parses formatted input string to minor units', () => {
      expect(parseMoneyToMinor('12.50', 'INR')).toBe(1250);
      expect(parseMoneyToMinor('$45.00', 'USD')).toBe(4500);
      expect(parseMoneyToMinor('₹1,200.75', 'INR')).toBe(120075);
      expect(parseMoneyToMinor('1000', 'JPY')).toBe(1000);
    });
  });

  describe('calculateEqualSplit', () => {
    it('handles odd remainder deterministically by allocating 1 unit to first N members', () => {
      const splits = calculateEqualSplit(10000, ['u1', 'u2', 'u3']);
      expect(splits).toHaveLength(3);
      expect(splits[0].amountMinor).toBe(3334);
      expect(splits[1].amountMinor).toBe(3333);
      expect(splits[2].amountMinor).toBe(3333);
      const sum = splits.reduce((acc, s) => acc + s.amountMinor, 0);
      expect(sum).toBe(10000);
    });

    it('handles zero participants safely', () => {
      expect(calculateEqualSplit(5000, [])).toEqual([]);
    });
  });

  describe('calculatePercentageSplit', () => {
    it('handles percentage rounding adjustments on largest contributor', () => {
      const splits = calculatePercentageSplit(10000, [
        { userId: 'u1', percentage: 33.33 },
        { userId: 'u2', percentage: 33.33 },
        { userId: 'u3', percentage: 33.34 },
      ]);
      const sum = splits.reduce((acc, s) => acc + s.amountMinor, 0);
      expect(sum).toBe(10000);
    });
  });

  describe('calculateSharesSplit', () => {
    it('distributes total based on relative share weights', () => {
      const splits = calculateSharesSplit(6000, [
        { userId: 'u1', shares: 1 },
        { userId: 'u2', shares: 2 },
        { userId: 'u3', shares: 3 },
      ]);
      expect(splits[0].amountMinor).toBe(1000);
      expect(splits[1].amountMinor).toBe(2000);
      expect(splits[2].amountMinor).toBe(3000);
      const sum = splits.reduce((acc, s) => acc + s.amountMinor, 0);
      expect(sum).toBe(6000);
    });
  });

  describe('calculateItemizedSplit', () => {
    it('splits items individually and distributes tax/tip proportionally', () => {
      const items = [
        { id: '1', name: 'Pizza', priceMinor: 2000, assignedUserIds: ['u1', 'u2'] },
        { id: '2', name: 'Burger', priceMinor: 1000, assignedUserIds: ['u3'] },
      ];
      const splits = calculateItemizedSplit(items, 300, ['u1', 'u2', 'u3']);
      expect(splits.find((s) => s.userId === 'u1')?.amountMinor).toBe(1100);
      expect(splits.find((s) => s.userId === 'u2')?.amountMinor).toBe(1100);
      expect(splits.find((s) => s.userId === 'u3')?.amountMinor).toBe(1100);
      const total = splits.reduce((acc, s) => acc + s.amountMinor, 0);
      expect(total).toBe(3300);
    });
  });

  describe('calculateNetBalances & Multi-Currency Isolation', () => {
    const expenses: Expense[] = [
      {
        id: 'e1',
        groupId: 'g_inr',
        title: 'Dinner',
        totalMinor: 30000,
        currency: 'INR',
        category: 'Food',
        date: '2026-10-26',
        payers: [{ userId: 'u1', amountMinor: 30000 }],
        splitType: 'equal',
        splits: [
          { userId: 'u1', amountMinor: 10000 },
          { userId: 'u2', amountMinor: 10000 },
          { userId: 'u3', amountMinor: 10000 },
        ],
        createdAt: '2026-10-26',
        createdBy: 'u1',
      },
      {
        id: 'e2',
        groupId: 'g_inr',
        title: 'Groceries',
        totalMinor: 15000,
        currency: 'INR',
        category: 'Groceries',
        date: '2026-10-26',
        payers: [{ userId: 'u2', amountMinor: 15000 }],
        splitType: 'equal',
        splits: [
          { userId: 'u2', amountMinor: 7500 },
          { userId: 'u3', amountMinor: 7500 },
        ],
        createdAt: '2026-10-26',
        createdBy: 'u2',
      },
      {
        id: 'e3',
        groupId: 'g_eur',
        title: 'Train ticket',
        totalMinor: 5000, // €50.00
        currency: 'EUR',
        category: 'Transport',
        date: '2026-10-27',
        payers: [{ userId: 'u1', amountMinor: 5000 }],
        splitType: 'equal',
        splits: [
          { userId: 'u1', amountMinor: 2500 },
          { userId: 'u2', amountMinor: 2500 },
        ],
        createdAt: '2026-10-27',
        createdBy: 'u1',
      },
    ];

    it('calculates single-group net balances accurately', () => {
      const balances = calculateNetBalances(expenses, [], 'g_inr');
      expect(balances['u1']).toBe(20000);
      expect(balances['u2']).toBe(-2500);
      expect(balances['u3']).toBe(-17500);
    });

    it('isolates multi-currency balances per currency', () => {
      const byCurrency = calculateBalancesByCurrency(expenses, []);
      expect(byCurrency.INR).toBeDefined();
      expect(byCurrency.EUR).toBeDefined();

      // INR checks
      expect(byCurrency.INR?.['u1']).toBe(20000);
      expect(byCurrency.INR?.['u2']).toBe(-2500);
      expect(byCurrency.INR?.['u3']).toBe(-17500);

      // EUR checks: u1 paid 5000, owes 2500 => +2500
      expect(byCurrency.EUR?.['u1']).toBe(2500);
      expect(byCurrency.EUR?.['u2']).toBe(-2500);
      expect(byCurrency.EUR?.['u3']).toBeUndefined();
    });

    it('simplifies debts with minimum transactions (greedy algorithm)', () => {
      const balances = calculateNetBalances(expenses, [], 'g_inr');
      const simplified = simplifyDebts(balances, 'INR');
      expect(simplified).toHaveLength(2);
      expect(simplified[0]).toEqual({
        fromUserId: 'u3',
        toUserId: 'u1',
        amountMinor: 17500,
        currency: 'INR',
      });
      expect(simplified[1]).toEqual({
        fromUserId: 'u2',
        toUserId: 'u1',
        amountMinor: 2500,
        currency: 'INR',
      });
    });
  });

  describe('validateSplits', () => {
    it('validates matching sum', () => {
      const result = validateSplits(
        3000,
        [
          { userId: 'u1', amountMinor: 1500 },
          { userId: 'u2', amountMinor: 1500 },
        ],
        'equal',
      );
      expect(result.valid).toBe(true);
    });

    it('fails when split sum does not match total', () => {
      const result = validateSplits(
        3000,
        [
          { userId: 'u1', amountMinor: 1500 },
          { userId: 'u2', amountMinor: 1400 },
        ],
        'exact',
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Splits sum does not match');
    });
  });
});
