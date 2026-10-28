import React, { useState } from 'react';
import { ActivityEvent, Group, Settlement, User } from '../types';
import { formatMoney } from '../engine/expenseEngine';
import { 
  History, 
  Receipt, 
  CheckCircle2, 
  UserPlus, 
  RotateCcw, 
  ArrowUpRight,
  Filter
} from 'lucide-react';

interface ActivityTabProps {
  activity: ActivityEvent[];
  settlements: Settlement[];
  allUsers: User[];
  groups: Group[];
}

export const ActivityTab: React.FC<ActivityTabProps> = ({
  activity,
  settlements,
  allUsers,
  groups,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'settlement' | 'expense'>('all');

  const userMap = new Map(allUsers.map((u) => [u.id, u]));
  const groupMap = new Map(groups.map((g) => [g.id, g]));

  const filtered = activity.filter((act) => {
    if (filterType === 'settlement') return act.type === 'settlement_recorded';
    if (filterType === 'expense') return act.type.startsWith('expense');
    return true;
  });

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Activity & Audit Trail
          </h2>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            Complete immutable log of all transactions, edits, reversals, and settlements.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl" style={{ background: 'var(--border-subtle)' }}>
          {[
            { id: 'all', label: 'All Activity' },
            { id: 'expense', label: 'Expenses' },
            { id: 'settlement', label: 'Settlements' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === f.id
                  ? 'bg-white dark:bg-gray-800 text-emerald-500 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Confirmed Settlements Ledger */}
      {settlements.length > 0 && filterType !== 'expense' && (
        <div className="glass-panel p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              Completed Settlements ({settlements.length})
            </h3>
            <span className="badge badge-success text-[10px]">Verified Transfers</span>
          </div>

          <div className="space-y-2">
            {settlements.map((s) => {
              const from = userMap.get(s.fromUserId);
              const to = userMap.get(s.toUserId);
              const grp = groupMap.get(s.groupId);

              return (
                <div
                  key={s.id}
                  className="p-3 rounded-xl border flex items-center justify-between text-xs"
                  style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold flex items-center gap-1.5">
                        <span>{from?.name}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-gray-400" />
                        <span>{to?.name}</span>
                        <span className="badge badge-brand text-[9px] uppercase">{s.method}</span>
                      </div>
                      <p className="text-[11px] text-gray-400">
                        {grp?.name} · {s.date} {s.notes ? `· "${s.notes}"` : ''}
                      </p>
                    </div>
                  </div>

                  <span className="font-display font-bold text-sm text-emerald-500">
                    {formatMoney(s.amountMinor, s.currency)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Chronological Audit Stream */}
      <div className="glass-panel p-6">
        <h3 className="font-display font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
          Detailed Event Log
        </h3>

        {filtered.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400">
            No events found for this filter.
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-500/20">
            {filtered.map((act) => {
              const actor = userMap.get(act.actorId);
              let Icon = Receipt;
              let iconColor = 'text-indigo-400 bg-indigo-500/15';

              if (act.type === 'settlement_recorded') {
                Icon = CheckCircle2;
                iconColor = 'text-emerald-400 bg-emerald-500/15';
              } else if (act.type === 'expense_reversed') {
                Icon = RotateCcw;
                iconColor = 'text-rose-500 bg-rose-500/15';
              } else if (act.type === 'member_joined') {
                Icon = UserPlus;
                iconColor = 'text-violet-400 bg-violet-500/15';
              }

              return (
                <div key={act.id} className="relative flex items-start gap-3 text-xs">
                  <div className={`w-6 h-6 -ml-9 rounded-full flex items-center justify-center shrink-0 ring-4 ring-white dark:ring-gray-900 ${iconColor}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex-1">
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {act.summary}
                    </p>
                    <span className="text-[10px] text-gray-400 block mt-0.5">
                      {new Date(act.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
