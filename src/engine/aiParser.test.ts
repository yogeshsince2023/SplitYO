import { describe, it, expect } from 'vitest';
import { parseNaturalLanguageExpense, isSpeechRecognitionSupported } from './aiParser';
import { INITIAL_USERS } from './offlineStore';

describe('aiParser', () => {
  const members = INITIAL_USERS;
  const currentUserId = 'usr_arjun';

  describe('parseNaturalLanguageExpense', () => {
    it('parses basic expense with INR symbol, category, and payer', () => {
      const draft = parseNaturalLanguageExpense(
        '₹1,200 dinner paid by Priya for everyone',
        members,
        currentUserId,
        'INR',
      );

      expect(draft.totalMinor).toBe(120000);
      expect(draft.currency).toBe('INR');
      expect(draft.category).toBe('Food');
      expect(draft.payerUserId).toBe('usr_priya');
      expect(draft.participantUserIds).toHaveLength(members.length);
      expect(draft.confidence).toBeGreaterThan(0.8);
    });

    it('parses USD expense with "dollars" keyword and specific participants', () => {
      const draft = parseNaturalLanguageExpense(
        '45 dollars for uber with Rahul and me',
        members,
        currentUserId,
        'USD',
      );

      expect(draft.totalMinor).toBe(4500);
      expect(draft.currency).toBe('USD');
      expect(draft.category).toBe('Transport');
      expect(draft.payerUserId).toBe(currentUserId);
      expect(draft.participantUserIds).toContain('usr_rahul');
      expect(draft.participantUserIds).toContain(currentUserId);
    });

    it('falls back safely when text contains no amount', () => {
      const draft = parseNaturalLanguageExpense(
        'groceries at supermarket',
        members,
        currentUserId,
        'INR',
      );

      expect(draft.totalMinor).toBe(0);
      expect(draft.category).toBe('Groceries');
      expect(draft.confidence).toBeLessThan(0.8);
    });
  });

  describe('isSpeechRecognitionSupported', () => {
    it('returns a boolean in any environment', () => {
      const supported = isSpeechRecognitionSupported();
      expect(typeof supported).toBe('boolean');
    });
  });
});
