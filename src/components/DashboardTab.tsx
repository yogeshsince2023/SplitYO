import React, { useState } from 'react';
import { 
  Currency, 
  Expense, 
  Group, 
  Settlement, 
  User 
} from '../types';
import { 
  calculateNetBalances, 
  calculateBalancesByCurrency,
  calculatePairwiseBalance,
  simplifyDebts, 
  formatMoney 
} from '../engine/expenseEngine';
import { CATEGORIES, formatSplitwiseDate } from '../engine/categoryHelper';
import { 
  Users, 
  ChevronRight, 
  CheckCircle2, 
  Plus, 
  CreditCard, 
  UserCheck, 
  Receipt 
} from 'lucide-react';

interface DashboardTabProps {
  currentUser: User;
  allUsers: User[];
  groups: Group[];
  expenses: Expense[];
  settlements: Settlement[];
  onSelectGroup: (groupId: string) => void;
  onOpenSettleModal: (debtorId: string, creditorId: string, amountMinor: number, currency: Currency, groupId: string) => void;
  onOpenAddExpense: () => void;
  onNavigateTab?: (tab: 'groups' | 'activity' | 'insights') => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  currentUser,
  allUsers,
  groups,
  expenses,
  settlements,
  onSelectGroup,
  onOpenSettleModal,
  onOpenAddExpense,
  onNavigateTab,
}) => {
  const [activeSection, setActiveSection] = useState<'groups' | 'friends'>('groups');

  const userMap = new Map(allUsers.map((u) => [u.id, u]));
  const friends = allUsers.filter((u) => u.id !== currentUser?.id);

  // Calculate isolated per-currency balances for current user
  const balancesByCurrency = calculateBalancesByCurrency(expenses, settlements);
  const activeCurrencies = (Object.keys(balancesByCurrency) as Currency[]).filter(
    (c) => (balancesByCurrency[c]?.[currentUser?.id || ''] || 0) !== 0,
  );

  // Primary currency (defaults to INR or first group currency)
  const primaryCurrency: Currency = activeCurrencies[0] || groups[0]?.currency || 'INR';
  const myPrimaryNet = balancesByCurrency[primaryCurrency]?.[currentUser?.id || ''] || 0;

  // Track owed and owe per currency
  const owedToMeByCurr: Partial<Record<Currency, number>> = {};
  const iOweByCurr: Partial<Record<Currency, number>> = {};

  const allSuggestedSettlements: {
    groupId: string;
    groupName: string;
    currency: Currency;
    fromUser: User;
    toUser: User;
    amountMinor: number;
  }[] = [];

  groups.forEach((grp) => {
    const grpBalances = calculateNetBalances(expenses, settlements, grp.id, grp.currency);
    const simplified = simplifyDebts(grpBalances, grp.currency);
    simplified.forEach((s) => {
      const fromUser = userMap.get(s.fromUserId);
      const toUser = userMap.get(s.toUserId);
      if (fromUser && toUser) {
        if (s.toUserId === currentUser?.id) {
          owedToMeByCurr[grp.currency] = (owedToMeByCurr[grp.currency] || 0) + s.amountMinor;
        } else if (s.fromUserId === currentUser?.id) {
          iOweByCurr[grp.currency] = (iOweByCurr[grp.currency] || 0) + s.amountMinor;
        }
        allSuggestedSettlements.push({
          groupId: grp.id,
          groupName: grp.name,
          currency: grp.currency,
          fromUser,
          toUser,
          amountMinor: s.amountMinor,
        });
      }
    });
  });

  const primaryOwedToMe = owedToMeByCurr[primaryCurrency] || 0;
  const primaryIOwe = iOweByCurr[primaryCurrency] || 0;

  const recentExpenses = [...expenses]
    .filter((e) => !e.isReversed)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const firstName = currentUser?.name ? currentUser.name.split(' ')[0] : 'there';

  return (
    <div className="space-y-4 pb-24">

      {/* 1. SPLITWISE SIGNATURE HERO CARD */}
      <div 
        className="glass-panel p-5 relative overflow-hidden rounded-2xl border shadow-lg"
        style={{ 
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.14) 0%, rgba(139, 92, 246, 0.06) 100%)',
          borderColor: 'var(--border-subtle)' 
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-400">
            Hi, {firstName} 👋
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            myPrimaryNet > 0 
              ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' 
              : myPrimaryNet < 0 
              ? 'text-rose-400 border-rose-500/30 bg-rose-500/10' 
              : 'text-gray-400 border-gray-500/30 bg-gray-500/10'
          }`}>
            {myPrimaryNet > 0 ? 'Overall: in credit' : myPrimaryNet < 0 ? 'Overall: in debt' : 'Settled up'}
          </span>
        </div>

        {/* Big Splitwise Headline */}
        <div className="my-2">
          {myPrimaryNet > 0 ? (
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-semibold text-gray-300">Overall, you are owed</span>
              <span className="text-2xl sm:text-3xl font-display font-extrabold text-emerald-500">
                +{formatMoney(myPrimaryNet, primaryCurrency)}
              </span>
            </div>
          ) : myPrimaryNet < 0 ? (
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-semibold text-gray-300">Overall, you owe</span>
              <span className="text-2xl sm:text-3xl font-display font-extrabold text-rose-500">
                {formatMoney(myPrimaryNet, primaryCurrency)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span className="text-lg font-display font-bold">You are all settled up!</span>
            </div>
          )}

          {activeCurrencies.length > 1 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {activeCurrencies.slice(1).map((curr) => {
                const net = balancesByCurrency[curr]?.[currentUser?.id || ''] || 0;
                return (
                  <span
                    key={curr}
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                      net >= 0 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-rose-400 border-rose-500/30 bg-rose-500/10'
                    }`}
                  >
                    {curr}: {net >= 0 ? '+' : ''}{formatMoney(net, curr)}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Dual Summary Metrics (You Owe vs You Are Owed) */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="p-2.5 rounded-xl border" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block mb-0.5">
              You owe
            </span>
            <span className={`text-base font-display font-bold ${primaryIOwe > 0 ? 'text-rose-500' : 'text-gray-400'}`}>
              {formatMoney(primaryIOwe, primaryCurrency)}
            </span>
          </div>

          <div className="p-2.5 rounded-xl border" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-0.5">
              You are owed
            </span>
            <span className={`text-base font-display font-bold ${primaryOwedToMe > 0 ? 'text-emerald-500' : 'text-gray-400'}`}>
              {formatMoney(primaryOwedToMe, primaryCurrency)}
            </span>
          </div>
        </div>

        {/* Splitwise Action Buttons (Add Expense & Settle Up) */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={onOpenAddExpense}
            className="flex-1 gradient-btn py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-98"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" /> Add Expense
          </button>

          {allSuggestedSettlements.length > 0 && (
            <button
              onClick={() => {
                const myDebt = allSuggestedSettlements.find((s) => s.fromUser.id === currentUser?.id);
                if (myDebt) {
                  onOpenSettleModal(myDebt.fromUser.id, myDebt.toUser.id, myDebt.amountMinor, myDebt.currency, myDebt.groupId);
                } else if (allSuggestedSettlements[0]) {
                  const s = allSuggestedSettlements[0];
                  onOpenSettleModal(s.fromUser.id, s.toUser.id, s.amountMinor, s.currency, s.groupId);
                }
              }}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl border flex items-center gap-1.5 hover:bg-gray-500/10 transition-colors"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
            >
              <CreditCard className="w-3.5 h-3.5 text-indigo-400" /> Settle Up
            </button>
          )}
        </div>
      </div>

      {/* 2. SECTION SWITCHER (GROUPS vs FRIENDS) */}
      <div className="flex items-center gap-2 border-b pb-1" style={{ borderColor: 'var(--border-subtle)' }}>
        <button
          onClick={() => setActiveSection('groups')}
          className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
            activeSection === 'groups' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Groups ({groups.length})
        </button>
        <button
          onClick={() => setActiveSection('friends')}
          className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
            activeSection === 'friends' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Friends ({friends.length})
        </button>
      </div>

      {/* 3. GROUPS VIEW */}
      {activeSection === 'groups' && (
        <div className="space-y-2">
          {groups.length === 0 ? (
            <div className="glass-panel p-6 text-center flex flex-col items-center justify-center rounded-2xl border" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="w-10 h-10 rounded-full bg-indigo-500/15 flex items-center justify-center text-indigo-400 mb-2">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>No Groups Yet</div>
              <p className="text-[11px] text-gray-400 max-w-xs mt-1 mb-3">
                Create a group for your trip, house, or friends to start splitting expenses.
              </p>
              <button
                onClick={() => onNavigateTab ? onNavigateTab('groups') : null}
                className="gradient-btn px-3.5 py-1.5 text-xs font-semibold rounded-xl shadow-sm"
              >
                + Create Your First Group
              </button>
            </div>
          ) : (
            groups.map((grp) => {
              const grpBalances = calculateNetBalances(expenses, settlements, grp.id, grp.currency);
              const myGrpBalance = grpBalances[currentUser?.id || ''] || 0;

              return (
                <div
                  key={grp.id}
                  onClick={() => onSelectGroup(grp.id)}
                  className="glass-panel p-3.5 card-interactive overflow-hidden relative rounded-xl border flex items-center justify-between"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-sm flex-shrink-0" style={{ background: 'var(--brand-gradient)' }}>
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-display font-bold text-xs truncate" style={{ color: 'var(--text-primary)' }}>
                        {grp.name}
                      </h4>
                      <p className="text-[10px] text-gray-400 capitalize">
                        {grp.category} · {grp.members.length} members
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 flex items-center gap-2">
                    <div>
                      <span className="text-[9px] text-gray-400 block uppercase">
                        {myGrpBalance > 0 ? 'You are owed' : myGrpBalance < 0 ? 'You owe' : 'Settled'}
                      </span>
                      <span className={`text-xs font-bold ${myGrpBalance > 0 ? 'text-emerald-500' : myGrpBalance < 0 ? 'text-rose-500' : 'text-gray-400'}`}>
                        {myGrpBalance > 0 ? `+${formatMoney(myGrpBalance, grp.currency)}` : formatMoney(myGrpBalance, grp.currency)}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 4. FRIENDS VIEW (DIRECT 1-ON-1 SPLITS) */}
      {activeSection === 'friends' && (
        <div className="space-y-2">
          {friends.length === 0 ? (
            <div className="glass-panel p-6 text-center flex flex-col items-center justify-center rounded-2xl border" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="w-10 h-10 rounded-full bg-indigo-500/15 flex items-center justify-center text-indigo-400 mb-2">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>No Friends Added Yet</div>
              <p className="text-[11px] text-gray-400 max-w-xs mt-1 mb-3">
                When you add an expense with someone or create a group, they will show up here with your 1-on-1 balances.
              </p>
              <button
                onClick={onOpenAddExpense}
                className="gradient-btn px-3.5 py-1.5 text-xs font-semibold rounded-xl shadow-sm"
              >
                + Add First Expense
              </button>
            </div>
          ) : (
            friends.map((f) => {
              const pairNet = calculatePairwiseBalance(currentUser?.id || '', f.id, expenses, settlements, primaryCurrency);
              return (
                <div
                  key={f.id}
                  className="glass-panel p-3 rounded-xl border flex items-center justify-between"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img 
                      src={f.avatar} 
                      alt={f.name} 
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-indigo-500/30 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-xs truncate" style={{ color: 'var(--text-primary)' }}>
                        {f.name}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate">
                        {f.upiId ? `UPI: ${f.upiId}` : 'Peer contact'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <span className="text-[9px] block text-gray-400 uppercase">
                        {pairNet > 0 ? 'owes you' : pairNet < 0 ? 'you owe' : 'settled'}
                      </span>
                      <span className={`text-xs font-bold ${pairNet > 0 ? 'text-emerald-500' : pairNet < 0 ? 'text-rose-500' : 'text-gray-400'}`}>
                        {pairNet > 0 ? `+${formatMoney(pairNet, primaryCurrency)}` : formatMoney(pairNet, primaryCurrency)}
                      </span>
                    </div>

                    {pairNet !== 0 && (
                      <button
                        onClick={() => {
                          const debtorId = pairNet < 0 ? currentUser?.id || '' : f.id;
                          const creditorId = pairNet < 0 ? f.id : currentUser?.id || '';
                          onOpenSettleModal(debtorId, creditorId, Math.abs(pairNet), primaryCurrency, groups[0]?.id || '');
                        }}
                        className="gradient-btn px-2.5 py-1 text-[11px] font-bold rounded-lg shadow-sm"
                      >
                        Settle
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 5. RECENT TRANSACTIONS STREAM IN SPLITWISE STYLE */}
      <div className="glass-panel p-4 rounded-2xl border" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-indigo-400" />
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-gray-400">
              Recent Expenses
            </h3>
          </div>
          {onNavigateTab && (
            <button 
              onClick={() => onNavigateTab('activity')}
              className="text-[11px] text-indigo-400 font-semibold hover:underline"
            >
              See all
            </button>
          )}
        </div>

        <div className="space-y-2">
          {recentExpenses.length === 0 ? (
            <div className="text-center py-6 text-xs text-gray-400">
              No expenses recorded yet. Tap "+ Add Expense" above to get started.
            </div>
          ) : (
            recentExpenses.map((exp) => {
              const { month, day } = formatSplitwiseDate(exp.date);
              const payer = userMap.get(exp.payers[0]?.userId);
              const isPayerMe = exp.payers[0]?.userId === currentUser?.id;
              
              // Personal impact
              const myPaid = exp.payers.find((p) => p.userId === currentUser?.id)?.amountMinor || 0;
              const mySplit = exp.splits.find((s) => s.userId === currentUser?.id)?.amountMinor || 0;
              const myNet = myPaid - mySplit;

              const categoryMeta = CATEGORIES[exp.category] || CATEGORIES.General;

              return (
                <div
                  key={exp.id}
                  className="p-3 rounded-xl border flex items-center justify-between transition-colors hover:bg-gray-500/5"
                  style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}
                >
                  {/* Left: Date Badge & Category Icon & Title */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Date Pill */}
                    <div className="text-center w-8 shrink-0 py-0.5 rounded-lg border text-[9px] font-bold" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-surface)' }}>
                      <span className="block text-gray-400 leading-none text-[8px] uppercase">{month}</span>
                      <span className="block text-gray-200 leading-tight text-xs font-display">{day}</span>
                    </div>

                    {/* Category Icon */}
                    <div 
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0"
                      style={{ background: categoryMeta.bgColor }}
                    >
                      {categoryMeta.icon}
                    </div>

                    {/* Title & Who Paid */}
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                        {exp.title}
                      </h4>
                      <p className="text-[10px] text-gray-400 truncate">
                        {isPayerMe ? 'You paid' : `${payer?.name?.split(' ')[0] || 'Someone'} paid`} {formatMoney(exp.totalMinor, exp.currency)}
                      </p>
                    </div>
                  </div>

                  {/* Right: Personal Splitwise Impact */}
                  <div className="text-right shrink-0">
                    {myNet > 0 ? (
                      <div>
                        <span className="text-[9px] block text-emerald-400 font-semibold uppercase">you lent</span>
                        <span className="text-xs font-bold text-emerald-500 font-display">
                          +{formatMoney(myNet, exp.currency)}
                        </span>
                      </div>
                    ) : myNet < 0 ? (
                      <div>
                        <span className="text-[9px] block text-rose-400 font-semibold uppercase">you borrowed</span>
                        <span className="text-xs font-bold text-rose-500 font-display">
                          -{formatMoney(Math.abs(myNet), exp.currency)}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-[9px] block text-gray-400 uppercase">no balance</span>
                        <span className="text-xs font-bold text-gray-400 font-display">
                          {formatMoney(exp.totalMinor, exp.currency)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};
