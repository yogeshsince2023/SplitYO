import React, { useState } from 'react';
import { Currency, Expense, Group, User } from '../types';
import { formatMoney } from '../engine/expenseEngine';
import { 
  PieChart, 
  TrendingUp, 
  Calendar, 
  BarChart3, 
  Download, 
  Layers, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { triggerFileDownload } from '../engine/offlineStore';

interface InsightsTabProps {
  currentUser: User;
  allUsers: User[];
  groups: Group[];
  expenses: Expense[];
}

export const InsightsTab: React.FC<InsightsTabProps> = ({
  currentUser,
  allUsers,
  groups,
  expenses,
}) => {
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('INR');

  const validExpenses = expenses.filter(
    (e) => !e.isReversed && e.currency === selectedCurrency,
  );

  // 1. Total Group Spending
  const totalGroupSpendingMinor = validExpenses.reduce((acc, e) => acc + e.totalMinor, 0);

  // 2. Current User's Personal Share of Expenses
  const myTotalShareMinor = validExpenses.reduce((acc, e) => {
    const split = e.splits.find((s) => s.userId === currentUser.id);
    return acc + (split?.amountMinor || 0);
  }, 0);

  // 3. Category Breakdown
  const categoryTotals: Record<string, number> = {};
  validExpenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.totalMinor;
  });

  const categoriesSorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  // 4. Per Group Breakdown
  const groupTotals: Record<string, number> = {};
  validExpenses.forEach((e) => {
    groupTotals[e.groupId] = (groupTotals[e.groupId] || 0) + e.totalMinor;
  });

  // 5. Payer Breakdown
  const userMap = new Map(allUsers.map((u) => [u.id, u]));
  const payerTotals: Record<string, number> = {};
  validExpenses.forEach((e) => {
    e.payers.forEach((p) => {
      payerTotals[p.userId] = (payerTotals[p.userId] || 0) + p.amountMinor;
    });
  });

  const handleExportFullReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      currency: selectedCurrency,
      totalSpendingMinor: totalGroupSpendingMinor,
      myShareMinor: myTotalShareMinor,
      categoryBreakdown: categoryTotals,
      expensesCount: validExpenses.length,
      expenses: validExpenses,
    };
    triggerFileDownload(`SplitMate_Financial_Insights_${selectedCurrency}.json`, JSON.stringify(report, null, 2), 'application/json');
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Spending Insights & Analytics
          </h2>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            Transparent breakdown of group expenditures, category budgets, and trends.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value as Currency)}
            className="text-xs font-semibold px-3 py-2 rounded-xl border outline-none"
            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
          >
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
          </select>

          <button
            onClick={handleExportFullReport}
            className="gradient-btn px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Export Insights
          </button>
        </div>
      </div>

      {/* Top Level Metric Cards */}
      <div className="space-y-3">
        {/* Hero Spending Card */}
        <div className="glass-panel p-4" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.05) 100%)' }}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Shared Pool Spending</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <h3 className="text-2xl font-display font-extrabold mt-1.5" style={{ color: 'var(--text-primary)' }}>
            {formatMoney(totalGroupSpendingMinor, selectedCurrency)}
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">Across {validExpenses.length} active group expenses</p>
        </div>

        {/* 2-col Secondary Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-panel p-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Your Share</span>
              <div className="w-6 h-6 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                <Layers className="w-3 h-3" />
              </div>
            </div>
            <h4 className="text-lg font-display font-extrabold text-indigo-400">
              {formatMoney(myTotalShareMinor, selectedCurrency)}
            </h4>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {totalGroupSpendingMinor > 0
                ? `${((myTotalShareMinor / totalGroupSpendingMinor) * 100).toFixed(0)}% of total`
                : '0%'}
            </p>
          </div>

          <div className="glass-panel p-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Avg / Expense</span>
              <div className="w-6 h-6 rounded-lg bg-violet-500/15 text-violet-400 flex items-center justify-center">
                <Calendar className="w-3 h-3" />
              </div>
            </div>
            <h4 className="text-lg font-display font-extrabold text-violet-400">
              {validExpenses.length > 0 ? (totalGroupSpendingMinor / validExpenses.length / 100).toFixed(0) : '0'} {selectedCurrency}
            </h4>
            <p className="text-[10px] text-gray-400 mt-0.5">Mean transaction</p>
          </div>
        </div>
      </div>

      {/* Category Breakdown Progress Bars */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="font-display font-bold text-base" style={{ color: 'var(--text-primary)' }}>
              Category Breakdown
            </h3>
          </div>
          <span className="text-xs text-gray-400">By total expenditure</span>
        </div>

        {categoriesSorted.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400">
            No expenses recorded in {selectedCurrency} yet.
          </div>
        ) : (
          <div className="space-y-4">
            {categoriesSorted.map(([category, amtMinor]) => {
              const pct = totalGroupSpendingMinor > 0 ? (amtMinor / totalGroupSpendingMinor) * 100 : 0;
              return (
                <div key={category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span style={{ color: 'var(--text-primary)' }}>{category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">{pct.toFixed(1)}%</span>
                      <span className="text-indigo-400 font-bold">{formatMoney(amtMinor, selectedCurrency)}</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Group Spending Breakdown & Top Payers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* By Group */}
        <div className="glass-panel p-5">
          <h4 className="font-display font-bold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
            Spending by Group
          </h4>
          <div className="space-y-3">
            {groups.map((grp) => {
              const spent = groupTotals[grp.id] || 0;
              const pct = totalGroupSpendingMinor > 0 ? (spent / totalGroupSpendingMinor) * 100 : 0;
              return (
                <div key={grp.id} className="p-3 rounded-xl border" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-primary)' }}>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span className="truncate">{grp.name}</span>
                    <span className="text-indigo-400 font-bold">{formatMoney(spent, selectedCurrency)}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-gray-500/10 overflow-hidden">
                    <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Payers */}
        <div className="glass-panel p-5">
          <h4 className="font-display font-bold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>
            Top Upfront Contributors
          </h4>
          <div className="space-y-2.5">
            {allUsers.map((u) => {
              const paid = payerTotals[u.id] || 0;
              return (
                <div
                  key={u.id}
                  className="p-2.5 rounded-xl border flex items-center justify-between text-xs"
                  style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-primary)' }}
                >
                  <div className="flex items-center gap-2.5">
                    <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-lg object-cover" />
                    <span className="font-medium">{u.name}</span>
                  </div>
                  <span className="font-bold text-indigo-400">{formatMoney(paid, selectedCurrency)}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
