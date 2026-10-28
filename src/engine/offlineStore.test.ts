import { describe, it, expect, beforeEach } from 'vitest';
import {
  exportGroupExpensesCsv,
  loadAppState,
  saveAppState,
  INITIAL_GROUPS,
  INITIAL_USERS,
} from './offlineStore';
import { Expense } from '../types';

describe('offlineStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('CSV Export & Formula Injection Prevention', () => {
    it('sanitizes formula injection characters (=, +, -, @) in titles and notes', () => {
      const maliciousExpenses: Expense[] = [
        {
          id: 'exp_malicious_1',
          groupId: 'grp_test',
          title: '=cmd|\' /C calc\'!A0',
          totalMinor: 10000,
          currency: 'INR',
          category: 'Food',
          date: '2026-10-28',
          notes: '+100-50*2',
          payers: [{ userId: 'usr_arjun', amountMinor: 10000 }],
          splitType: 'equal',
          splits: [{ userId: 'usr_arjun', amountMinor: 10000 }],
          createdAt: '2026-10-28',
          createdBy: 'usr_arjun',
        },
        {
          id: 'exp_malicious_2',
          groupId: 'grp_test',
          title: '@SUM(1+1)',
          totalMinor: 20000,
          currency: 'INR',
          category: 'Shopping',
          date: '2026-10-28',
          notes: '-2+5',
          payers: [{ userId: 'usr_arjun', amountMinor: 20000 }],
          splitType: 'equal',
          splits: [{ userId: 'usr_arjun', amountMinor: 20000 }],
          createdAt: '2026-10-28',
          createdBy: 'usr_arjun',
        },
      ];

      const csv = exportGroupExpensesCsv(
        { ...INITIAL_GROUPS[0], id: 'grp_test' },
        maliciousExpenses,
        INITIAL_USERS,
      );

      // Formulas must be escaped with a leading single quote or safe prefix
      expect(csv).not.toContain('"=cmd|');
      expect(csv).toContain("\"'=cmd|");
      expect(csv).not.toContain('"+100-50*2"');
      expect(csv).toContain("\"'+100-50*2\"");
      expect(csv).not.toContain('"@SUM(1+1)"');
      expect(csv).toContain("\"'@SUM(1+1)\"");
    });
  });

  describe('Storage Resilience', () => {
    it('recovers with clean empty state when localStorage contains corrupted JSON', () => {
      localStorage.setItem('splitmate_data_v1', 'INVALID_JSON_{{]');
      const state = loadAppState();
      expect(state).toBeDefined();
      expect(state.currentUserId).toBe('');
      expect(state.users.length).toBe(0);
      expect(state.groups.length).toBe(0);
    });

    it('persists and restores state safely', () => {
      const state = loadAppState();
      state.currentUserId = 'usr_priya';
      saveAppState(state);

      const reloaded = loadAppState();
      expect(reloaded.currentUserId).toBe('usr_priya');
    });
  });
});
