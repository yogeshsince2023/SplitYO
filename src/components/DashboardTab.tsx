import React from 'react';
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
  simplifyDebts, 
  formatMoney 
} from '../engine/expenseEngine';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Sparkles, 
  Users, 
  ChevronRight, 
  CheckCircle2, 
  Receipt, 
  Plus,
  CreditCard
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
  const userMap = new Map(allUsers.map((u) => [u.id, u]));

  // Calculate isolated per-currency balances for current user
  const balancesByCurrency = calculateBalancesByCurrency(expenses, settlements);
  const activeCurrencies = (Object.keys(balancesByCurrency) as Currency[]).filter(
    (c) => (balancesByCurrency[c]?.[currentUser.id] || 0) !== 0,
  );

  // Fallback to INR or first group currency if no active debts
  const primaryCurrency: Currency = activeCurrencies[0] || groups[0]?.currency || 'INR';
  const myPrimaryNet = balancesByCurrency[primaryCurrency]?.[currentUser.id] || 0;

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
        if (s.toUserId === currentUser.id) {
          owedToMeByCurr[grp.currency] = (owedToMeByCurr[grp.currency] || 0) + s.amountMinor;
        } else if (s.fromUserId === currentUser.id) {
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
    .slice(0, 5);

  return (
    <div className="space-y-4 pb-24">
      {/* 1. HERO NET BALANCE CARD */}
      <div 
        className="glass-panel p-5 relative overflow-hidden" 
        style={{ 
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(168, 85, 247, 0.05) 100%)',
          borderColor: 'var(--border-highlight)' 
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Total Net Balance
            </span>
            <span className={`badge text-[9px] px-2 py-0.5 ${myPrimaryNet >= 0 ? 'badge-success' : 'badge-danger'}`}>
              {myPrimaryNet > 0 ? 'In Credit' : myPrimaryNet < 0 ? 'In Debt' : 'Settled'}
            </span>
          </div>

          <div 
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ 
              background: myPrimaryNet >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
              color: myPrimaryNet >= 0 ? '#10b981' : '#f43f5e'
            }}
          >
            {myPrimaryNet >= 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
          </div>
        </div>

        <div className="mt-2 mb-4">
          <h2 className={`text-3xl font-display font-extrabold tracking-tight ${myPrimaryNet >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {myPrimaryNet >= 0 ? '+' : ''}{formatMoney(myPrimaryNet, primaryCurrency)}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Primary balance ({primaryCurrency}) across {groups.length} active groups
          </p>
          {activeCurrencies.length > 1 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {activeCurrencies.slice(1).map((curr) => {
                const net = balancesByCurrency[curr]?.[currentUser.id] || 0;
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

        {/* Quick Action Button on Hero */}
        <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            onClick={onOpenAddExpense}
            className="flex-1 gradient-btn py-2 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" /> Add Expense
          </button>
          {allSuggestedSettlements.length > 0 && (
            <button
              onClick={() => {
                const myDebt = allSuggestedSettlements.find((s) => s.fromUser.id === currentUser.id);
                if (myDebt) {
                  onOpenSettleModal(myDebt.fromUser.id, myDebt.toUser.id, myDebt.amountMinor, myDebt.currency, myDebt.groupId);
                } else if (allSuggestedSettlements[0]) {
                  const s = allSuggestedSettlements[0];
                  onOpenSettleModal(s.fromUser.id, s.toUser.id, s.amountMinor, s.currency, s.groupId);
                }
              }}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-colors hover:bg-gray-500/10"
              style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
            >
              <CreditCard className="w-3.5 h-3.5 text-indigo-400" /> Settle
            </button>
          )}
        </div>
      </div>

      {/* 2. SUB-METRIC CARDS (YOU ARE OWED vs YOU OWE) */}
      <div className="grid grid-cols-2 gap-3">
        {/* You Are Owed */}
        <div className="glass-panel p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
              Owed to you
            </span>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <ArrowDownLeft className="w-3 h-3" />
            </div>
          </div>
          <h3 className="text-xl font-display font-extrabold text-emerald-500">
            {formatMoney(primaryOwedToMe, primaryCurrency)}
          </h3>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Incoming ({primaryCurrency})
          </p>
        </div>

        {/* You Owe */}
        <div className="glass-panel p-3.5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
              You owe
            </span>
            <div className="w-6 h-6 rounded-lg bg-rose-500/15 text-rose-500 flex items-center justify-center">
              <ArrowUpRight className="w-3 h-3" />
            </div>
          </div>
          <h3 className="text-xl font-display font-extrabold text-rose-500">
            {formatMoney(primaryIOwe, primaryCurrency)}
          </h3>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Pending ({primaryCurrency})
          </p>
        </div>
      </div>

      {/* 3. SMART DEBT SIMPLIFICATION */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-indigo-500/15 text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
                Simplified Debt Settlements
              </h3>
            </div>
          </div>
          <span className="badge badge-brand text-[9px] px-1.5 py-0.2">
            Minimal Transfers
          </span>
        </div>

        {allSuggestedSettlements.length === 0 ? (
          <div className="text-center py-4 text-xs text-gray-400">
            <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500 mb-1" />
            Everyone is all settled up! Zero debts remaining.
          </div>
        ) : (
          <div className="space-y-2">
            {allSuggestedSettlements.map((st, i) => {
              const isUserDebtor = st.fromUser.id === currentUser.id;
              const isUserCreditor = st.toUser.id === currentUser.id;

              return (
                <div
                  key={`settle_${i}`}
                  className="p-2.5 rounded-xl border flex items-center justify-between transition-all"
                  style={{
                    background: isUserDebtor ? 'rgba(244, 63, 94, 0.05)' : isUserCreditor ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img 
                      src={st.fromUser.avatar} 
                      alt={st.fromUser.name} 
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-rose-500/40 flex-shrink-0" 
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                        <span className="truncate">{st.fromUser.id === currentUser.id ? 'You' : st.fromUser.name.split(' ')[0]}</span>
                        <ArrowUpRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{st.toUser.id === currentUser.id ? 'You' : st.toUser.name.split(' ')[0]}</span>
                      </div>
                      <div className="text-[10px] text-gray-400 truncate">
                        {st.groupName}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-display font-bold text-xs text-emerald-500">
                      {formatMoney(st.amountMinor, st.currency)}
                    </span>

                    {isUserDebtor ? (
                      <button
                        onClick={() =>
                          onOpenSettleModal(
                            st.fromUser.id,
                            st.toUser.id,
                            st.amountMinor,
                            st.currency,
                            st.groupId,
                          )
                        }
                        className="gradient-btn px-2.5 py-1 text-[11px] font-bold rounded-lg shadow-sm"
                      >
                        Pay UPI
                      </button>
                    ) : isUserCreditor ? (
                      <button
                        onClick={() =>
                          onOpenSettleModal(
                            st.fromUser.id,
                            st.toUser.id,
                            st.amountMinor,
                            st.currency,
                            st.groupId,
                          )
                        }
                        className="px-2 py-1 text-[10px] font-medium rounded-lg border hover:bg-gray-500/10"
                        style={{ borderColor: 'var(--border-subtle)' }}
                      >
                        Record
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. ACTIVE GROUPS LIST */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-gray-400">
            Active Groups ({groups.length})
          </h3>
          <span 
            className="text-[11px] text-indigo-400 font-semibold cursor-pointer hover:underline"
            onClick={() => onNavigateTab ? onNavigateTab('groups') : onSelectGroup(groups[0]?.id || '')}
          >
            See all
          </span>
        </div>

        <div className="space-y-2">
          {groups.map((grp) => {
            const grpBalances = calculateNetBalances(expenses, settlements, grp.id);
            const myGrpBalance = grpBalances[currentUser.id] || 0;

            return (
              <div
                key={grp.id}
                onClick={() => onSelectGroup(grp.id)}
                className="glass-panel p-3 card-interactive overflow-hidden relative"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-sm flex-shrink-0" style={{ background: 'var(--brand-gradient)' }}>
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

                  <div className="text-right flex-shrink-0 flex items-center gap-1.5">
                    <div>
                      <span className="text-[9px] text-gray-400 block uppercase">Balance</span>
                      <span className={`text-xs font-bold ${myGrpBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {myGrpBalance >= 0 ? '+' : ''}{formatMoney(myGrpBalance, grp.currency)}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. RECENT TRANSACTIONS STREAM */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-gray-400">
            Recent Expenses
          </h3>
          {onNavigateTab ? (
            <button 
              onClick={() => onNavigateTab('activity')}
              className="text-[10px] text-indigo-400 font-semibold hover:underline"
            >
              View activity
            </button>
          ) : (
            <span className="text-[10px] text-gray-400">Latest 5</span>
          )}
        </div>

        <div className="space-y-2.5">
          {recentExpenses.length === 0 ? (
            <div className="text-center py-4 text-xs text-gray-400">
              No recent expenses recorded yet.
            </div>
          ) : (
            recentExpenses.map((exp) => {
              const payer = userMap.get(exp.payers[0]?.userId);
              const mySplit = exp.splits.find((s) => s.userId === currentUser.id);
              const iAmPayer = exp.payers.some((p) => p.userId === currentUser.id);

              return (
                <div 
                  key={exp.id}
                  className="flex items-center justify-between py-1.5 border-b last:border-none"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div 
                      className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                    >
                      <Receipt className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {exp.title}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {iAmPayer ? 'You paid' : `${payer?.name.split(' ')[0] || 'User'} paid`} · {exp.date}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                      {formatMoney(exp.totalMinor, exp.currency)}
                    </p>
                    <p className="text-[10px] font-semibold text-emerald-500">
                      {iAmPayer ? `You lent ${formatMoney(exp.totalMinor - (mySplit?.amountMinor || 0), exp.currency)}` : `Your share ${formatMoney(mySplit?.amountMinor || 0, exp.currency)}`}
                    </p>
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
