import React, { useState, useEffect } from 'react';
import { 
  Currency, 
  Expense, 
  Group, 
  RecurringBill, 
  Settlement, 
  User 
} from '../types';
import { 
  calculateNetBalances, 
  simplifyDebts, 
  formatMoney 
} from '../engine/expenseEngine';
import { exportGroupExpensesCsv, triggerFileDownload } from '../engine/offlineStore';
import { 
  X, 
  Download, 
  Share2, 
  Users, 
  Receipt, 
  Calendar, 
  ArrowUpRight, 
  CheckCircle2, 
  Plus, 
  QrCode
} from 'lucide-react';

interface GroupDetailModalProps {
  group: Group;
  currentUser: User;
  allUsers: User[];
  expenses: Expense[];
  settlements: Settlement[];
  recurringBills: RecurringBill[];
  onClose: () => void;
  onOpenAddExpense: (groupId: string) => void;
  onOpenSettleModal: (debtorId: string, creditorId: string, amountMinor: number, currency: Currency, groupId: string) => void;
  onReverseExpense: (expenseId: string) => void;
}

export const GroupDetailModal: React.FC<GroupDetailModalProps> = ({
  group,
  currentUser,
  allUsers,
  expenses,
  settlements,
  recurringBills,
  onClose,
  onOpenAddExpense,
  onOpenSettleModal,
  onReverseExpense,
}) => {
  const [subTab, setSubTab] = useState<'expenses' | 'balances' | 'recurring' | 'members'>('expenses');
  const [showShareModal, setShowShareModal] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const userMap = new Map(allUsers.map((u) => [u.id, u]));
  const groupExpenses = expenses.filter((e) => e.groupId === group.id);
  const groupSettlements = settlements.filter((s) => s.groupId === group.id);
  const groupRecurring = recurringBills.filter((r) => r.groupId === group.id);

  // Balances & Debt simplification for this group
  const balances = calculateNetBalances(groupExpenses, groupSettlements, group.id);
  const simplifiedDebts = simplifyDebts(balances, group.currency);

  const handleExportCsv = () => {
    const csv = exportGroupExpensesCsv(group, groupExpenses, allUsers);
    triggerFileDownload(`${group.name.replace(/[^a-zA-Z0-9]/g, '_')}_expenses.csv`, csv, 'text/csv');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto animate-modal-pop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="group-detail-title"
    >
      <div 
        className="glass-panel w-full max-w-xl relative my-auto max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
        style={{ background: 'var(--bg-surface)' }}
      >
        {/* Cover Header */}
        <div className="p-5 text-white relative" style={{ background: 'var(--brand-gradient)' }}>
          <div className="w-12 h-1 bg-white/40 rounded-full mx-auto mb-2 sm:hidden" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors shadow-md z-10"
            title="Close"
            aria-label="Close group details"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full bg-white/20 inline-block mb-1">
                {group.category} · {group.currency}
              </span>
              <h2 id="group-detail-title" className="text-2xl sm:text-3xl font-display font-extrabold">{group.name}</h2>
              <p className="text-xs text-white/80 mt-1">
                {group.members.length} members · Created {new Date(group.createdAt).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCsv}
                className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-semibold flex items-center gap-1.5 backdrop-blur-sm transition-colors"
                title="Export Group Expenses to CSV"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
              <button
                onClick={() => setShowShareModal(true)}
                className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-semibold flex items-center gap-1.5 backdrop-blur-sm transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" /> Invite Link
              </button>
            </div>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-2 px-6 border-b overflow-x-auto" style={{ borderColor: 'var(--border-subtle)' }}>
          {[
            { id: 'expenses', label: `Expenses (${groupExpenses.filter(e => !e.isReversed).length})`, icon: Receipt },
            { id: 'balances', label: 'Balances & Debts', icon: ArrowUpRight },
            { id: 'recurring', label: `Recurring (${groupRecurring.length})`, icon: Calendar },
            { id: 'members', label: `Members (${group.members.length})`, icon: Users },
          ].map((st) => {
            const Icon = st.icon;
            const active = subTab === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setSubTab(st.id as any)}
                className={`py-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap ${
                  active ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{st.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">

          {/* TAB 1: EXPENSES */}
          {subTab === 'expenses' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-400">Recorded Group Expenses</span>
                <button
                  onClick={() => onOpenAddExpense(group.id)}
                  className="gradient-btn px-3 py-1.5 text-xs font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Expense
                </button>
              </div>

              {groupExpenses.length === 0 ? (
                <div className="text-center py-10 text-xs text-gray-400">
                  No expenses added to this group yet. Click "Add Expense" to get started!
                </div>
              ) : (
                groupExpenses.map((exp) => {
                  const payer = userMap.get(exp.payers[0]?.userId);
                  const isReversed = exp.isReversed;

                  return (
                    <div
                      key={exp.id}
                      className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                        isReversed ? 'opacity-40 line-through bg-gray-500/5' : 'hover:border-indigo-500/30'
                      }`}
                      style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-xs">
                          {exp.category[0]}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                            {exp.title}
                          </h4>
                          <p className="text-[11px] text-gray-400">
                            Paid by <span className="font-semibold">{payer?.name || 'Someone'}</span> on {exp.date} · {exp.splitType} split ({exp.splits.length} people)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="font-display font-bold text-sm block" style={{ color: 'var(--text-primary)' }}>
                            {formatMoney(exp.totalMinor, exp.currency)}
                          </span>
                          {isReversed && (
                            <span className="badge badge-danger text-[9px]">Reversed</span>
                          )}
                        </div>

                        {!isReversed && (
                          <button
                            onClick={() => onReverseExpense(exp.id)}
                            className="text-[10px] text-rose-500 hover:underline px-2 py-1 rounded hover:bg-rose-500/10 transition-colors"
                            title="Reverse / Cancel this expense"
                          >
                            Reverse
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: BALANCES & SIMPLIFIED DEBTS */}
          {subTab === 'balances' && (
            <div className="space-y-5">
              
              {/* Member Net Balances */}
              <div>
                <h4 className="text-xs font-semibold text-gray-400 mb-2.5 uppercase tracking-wider">
                  Member Net Balances
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {group.members.map((m) => {
                    const u = userMap.get(m.userId);
                    const net = balances[m.userId] || 0;
                    return (
                      <div
                        key={m.userId}
                        className="p-3 rounded-xl border flex items-center justify-between text-xs"
                        style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}
                      >
                        <div className="flex items-center gap-2.5">
                          <img src={u?.avatar} alt={u?.name} className="w-8 h-8 rounded-lg object-cover" />
                          <span className="font-semibold">{u?.name}</span>
                        </div>
                        <span className={`font-bold ${net > 0 ? 'text-emerald-500' : net < 0 ? 'text-rose-500' : 'text-gray-400'}`}>
                          {net > 0 ? `+${formatMoney(net, group.currency)}` : formatMoney(net, group.currency)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Simplified Debts List */}
              <div className="pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Minimal Settlement Plan ({simplifiedDebts.length} Transfers)
                  </h4>
                  <span className="badge badge-brand text-[9px]">Zero Redundant Payments</span>
                </div>

                {simplifiedDebts.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-400">
                    <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-500 mb-1" />
                    All balances in this group are fully settled!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {simplifiedDebts.map((deb, idx) => {
                      const from = userMap.get(deb.fromUserId);
                      const to = userMap.get(deb.toUserId);
                      const isMe = deb.fromUserId === currentUser.id;

                      return (
                        <div
                          key={`sd_${idx}`}
                          className="p-3 rounded-xl border flex items-center justify-between text-xs"
                          style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{from?.name}</span>
                            <ArrowUpRight className="w-3.5 h-3.5 text-rose-500" />
                            <span className="font-semibold">{to?.name}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-bold text-indigo-400">
                              {formatMoney(deb.amountMinor, deb.currency)}
                            </span>
                            <button
                              onClick={() =>
                                onOpenSettleModal(
                                  deb.fromUserId,
                                  deb.toUserId,
                                  deb.amountMinor,
                                  deb.currency,
                                  group.id,
                                )
                              }
                              className="gradient-btn px-2.5 py-1 text-[11px]"
                            >
                              {isMe ? 'Settle with UPI' : 'Record'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: RECURRING BILLS */}
          {subTab === 'recurring' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-400">
                  Scheduled Household & Subscription Bills
                </span>
              </div>

              {groupRecurring.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400">
                  No recurring bills scheduled for this group.
                </div>
              ) : (
                groupRecurring.map((rec) => {
                  const payer = userMap.get(rec.payerUserId);
                  return (
                    <div
                      key={rec.id}
                      className="p-4 rounded-2xl border flex items-center justify-between"
                      style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                            {rec.title}
                          </h4>
                          <span className="badge badge-brand text-[9px]">{rec.interval}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Payer: {payer?.name} · Next Due: {rec.nextDueDate}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-display font-bold text-sm text-indigo-400 block">
                          {formatMoney(rec.amountMinor, rec.currency)}
                        </span>
                        <span className="text-[10px] text-indigo-500 font-medium">Active Schedule</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 4: MEMBERS */}
          {subTab === 'members' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-400">Group Members</span>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="text-indigo-400 text-xs font-semibold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Invite Member
                </button>
              </div>

              {group.members.map((m) => {
                const u = userMap.get(m.userId);
                return (
                  <div
                    key={m.userId}
                    className="p-3 rounded-xl border flex items-center justify-between text-xs"
                    style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}
                  >
                    <div className="flex items-center gap-3">
                      <img src={u?.avatar} alt={u?.name} className="w-8 h-8 rounded-lg object-cover" />
                      <div>
                        <div className="font-semibold flex items-center gap-1.5">
                          <span>{u?.name}</span>
                          {m.role === 'owner' && (
                            <span className="badge badge-brand text-[9px]">Owner</span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400">{u?.email}</span>
                      </div>
                    </div>

                    <span className="text-[11px] text-gray-400 capitalize">Role: {m.role}</span>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Share Invite Modal */}
        {showShareModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-modal-pop">
            <div className="glass-panel p-6 max-w-sm w-full text-center relative" style={{ background: 'var(--bg-surface)' }}>
              <button
                onClick={() => setShowShareModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <QrCode className="w-12 h-12 mx-auto text-indigo-400 mb-2" />
              <h3 className="font-display font-bold text-base">Invite to {group.name}</h3>
              <p className="text-xs text-gray-400 my-2">
                Share this invite code or link with friends to join this expense group.
              </p>

              <div className="p-3 my-3 rounded-xl border bg-black/5 dark:bg-white/5 font-mono font-bold text-lg text-indigo-400 tracking-wider">
                {group.inviteCode}
              </div>

              <button
                onClick={() => {
                  navigator.clipboard?.writeText(`https://splitmate.dev/join/${group.inviteCode}`);
                  alert('Invite link copied to clipboard!');
                  setShowShareModal(false);
                }}
                className="gradient-btn w-full py-2.5 text-xs font-semibold"
              >
                Copy Invite Link
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
