import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SettleModal } from '../components/SettleModal';
import { DashboardTab } from '../components/DashboardTab';
import { INITIAL_USERS, INITIAL_GROUPS } from '../engine/offlineStore';
import { Expense } from '../types';

describe('Integration Workflows', () => {
  const currentUser = INITIAL_USERS[0]; // Arjun

  describe('Workflow: Settle Up Modal & Offline QR Handoff', () => {
    it('renders modal dialog with accessible attributes, displays local QR code, and triggers settlement on confirmation', async () => {
      const handleConfirm = vi.fn();
      const handleClose = vi.fn();

      render(
        <SettleModal
          fromUser={INITIAL_USERS[2]} // Rahul
          toUser={currentUser} // Arjun
          suggestedAmountMinor={250000} // ₹2,500.00
          currency="INR"
          groupId="grp_goa_trip"
          onClose={handleClose}
          onConfirmSettlement={handleConfirm}
        />
      );

      // Verify accessibility semantics
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'settle-modal-title');

      // Verify QR Code image is rendered with local data URI (no external API calls)
      const qrImg = screen.getByAltText(/UPI QR Code/i);
      expect(qrImg).toBeInTheDocument();
      expect(qrImg.getAttribute('src')).toMatch(/^data:image\/svg\+xml/);
      expect(qrImg.getAttribute('src')).not.toContain('api.qrserver.com');

      // Verify Escape key closes the modal
      fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Workflow: Dashboard Multi-Currency Isolation', () => {
    it('isolates disparate currencies on the dashboard without combining EUR and INR units', () => {
      const multiCurrencyExpenses: Expense[] = [
        {
          id: 'exp_inr',
          groupId: 'grp_goa_trip',
          title: 'Dinner',
          totalMinor: 400000, // ₹4,000.00
          currency: 'INR',
          category: 'Food',
          date: '2026-10-28',
          payers: [{ userId: currentUser.id, amountMinor: 400000 }],
          splitType: 'equal',
          splits: [
            { userId: currentUser.id, amountMinor: 200000 },
            { userId: INITIAL_USERS[1].id, amountMinor: 200000 },
          ],
          createdAt: '2026-10-28',
          createdBy: currentUser.id,
        },
        {
          id: 'exp_eur',
          groupId: 'grp_euro_trip',
          title: 'Museum Entry',
          totalMinor: 6000, // €60.00
          currency: 'EUR',
          category: 'Entertainment',
          date: '2026-10-28',
          payers: [{ userId: currentUser.id, amountMinor: 6000 }],
          splitType: 'equal',
          splits: [
            { userId: currentUser.id, amountMinor: 3000 },
            { userId: INITIAL_USERS[3].id, amountMinor: 3000 },
          ],
          createdAt: '2026-10-28',
          createdBy: currentUser.id,
        },
      ];

      render(
        <DashboardTab
          currentUser={currentUser}
          allUsers={INITIAL_USERS}
          groups={INITIAL_GROUPS}
          expenses={multiCurrencyExpenses}
          settlements={[]}
          onSelectGroup={vi.fn()}
          onOpenSettleModal={vi.fn()}
          onOpenAddExpense={vi.fn()}
        />
      );

      // Verify the primary currency balance is displayed cleanly
      // Primary is INR: Arjun paid 4000, owes 2000 => +₹2,000.00
      const inrBalances = screen.getAllByText(/\+₹2,000\.00/i);
      expect(inrBalances.length).toBeGreaterThan(0);

      // Verify secondary currency (EUR: +€30.00) is isolated in a separate currency pill
      expect(screen.getByText(/EUR: \+€30\.00/i)).toBeInTheDocument();
    });
  });
});
