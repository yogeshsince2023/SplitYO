import React, { useState } from 'react';
import { Currency, Expense, Group, GroupCategory, Settlement, User } from '../types';
import { calculateNetBalances, formatMoney } from '../engine/expenseEngine';
import { 
  Users, 
  Plus, 
  ChevronRight, 
  Palmtree, 
  Home, 
  Heart, 
  Sparkles, 
  Briefcase, 
  Compass, 
  X
} from 'lucide-react';

interface GroupsTabProps {
  groups: Group[];
  currentUser: User;
  allUsers: User[];
  expenses: Expense[];
  settlements: Settlement[];
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: (group: Omit<Group, 'id' | 'createdAt' | 'inviteCode'>) => void;
  onOpenAddExpense: (groupId: string) => void;
}

const CATEGORY_ICONS: Record<GroupCategory, any> = {
  trip: Palmtree,
  home: Home,
  couple: Heart,
  event: Sparkles,
  office: Briefcase,
  other: Compass,
};

const GRADIENTS = [
  'from-indigo-600 via-indigo-700 to-violet-800',
  'from-indigo-500 via-purple-600 to-pink-600',
  'from-amber-500 via-orange-600 to-rose-600',
  'from-blue-600 via-indigo-700 to-purple-800',
  'from-fuchsia-600 via-pink-600 to-rose-500',
];

export const GroupsTab: React.FC<GroupsTabProps> = ({
  groups,
  currentUser,
  allUsers,
  expenses,
  settlements,
  onSelectGroup,
  onCreateGroup,
  onOpenAddExpense,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Group Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<GroupCategory>('trip');
  const [currency, setCurrency] = useState<Currency>('INR');
  const [coverGradient, setCoverGradient] = useState(GRADIENTS[0]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([currentUser.id]);

  const userMap = new Map(allUsers.map((u) => [u.id, u]));

  const filteredGroups = groups.filter(
    (g) => filterCategory === 'all' || g.category === filterCategory,
  );

  const handleCreate = () => {
    if (!name.trim()) return;

    onCreateGroup({
      name: name.trim(),
      category,
      currency,
      coverGradient,
      members: selectedUserIds.map((userId) => ({
        userId,
        role: userId === currentUser.id ? 'owner' : 'member',
        joinedAt: new Date().toISOString(),
      })),
    });

    setName('');
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Expense Groups
          </h2>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            Organize expenses for trips, roommates, couples, and office teams.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="gradient-btn px-4 py-2.5 text-xs font-semibold self-start sm:self-auto shadow-md"
        >
          <Plus className="w-4 h-4" /> Create New Group
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Groups' },
          { id: 'trip', label: '🌴 Trips' },
          { id: 'home', label: '🏠 House & Rent' },
          { id: 'couple', label: '❤️ Couples' },
          { id: 'office', label: '💼 Teams' },
          { id: 'event', label: '🎉 Events' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterCategory(f.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filterCategory === f.id
                ? 'text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            style={{
              background: filterCategory === f.id ? 'var(--brand-primary)' : 'var(--border-subtle)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredGroups.map((grp) => {
          const balances = calculateNetBalances(expenses, settlements, grp.id);
          const myBalance = balances[currentUser.id] || 0;
          const grpExpenses = expenses.filter((e) => e.groupId === grp.id && !e.isReversed);
          const Icon = CATEGORY_ICONS[grp.category] || Compass;

          return (
            <div
              key={grp.id}
              className="glass-panel overflow-hidden relative group card-interactive flex flex-col justify-between"
              onClick={() => onSelectGroup(grp.id)}
            >
              <div className="h-2" style={{ background: 'var(--brand-gradient)' }} />
              
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-gray-500/10 flex items-center justify-center text-indigo-400 flex-shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                        {grp.name}
                      </h3>
                      <span className="text-[10px] text-gray-400 uppercase font-semibold">
                        {grp.category} · {grp.currency}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                </div>

                <div className="my-4 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-gray-400 text-[11px] block">Activity</span>
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {grpExpenses.length} expenses
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-gray-400 text-[11px] block">Your Balance</span>
                    <span className={`font-bold ${myBalance > 0 ? 'text-emerald-500' : myBalance < 0 ? 'text-rose-500' : 'text-gray-400'}`}>
                      {myBalance > 0 ? `+${formatMoney(myBalance, grp.currency)}` : formatMoney(myBalance, grp.currency)}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {grp.members.slice(0, 5).map((m) => {
                      const u = userMap.get(m.userId);
                      return (
                        <img
                          key={m.userId}
                          src={u?.avatar}
                          alt={u?.name}
                          className="w-6 h-6 rounded-full ring-2 ring-white dark:ring-gray-900 object-cover"
                        />
                      );
                    })}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenAddExpense(grp.id);
                    }}
                    className="text-xs text-indigo-400 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE GROUP MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-modal-pop">
          <div className="glass-panel w-full max-w-md p-6 relative" style={{ background: 'var(--bg-surface)' }}>
            <div className="flex items-center justify-between pb-3 border-b mb-4" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-500/15 text-indigo-400">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-display font-bold text-base" style={{ color: 'var(--text-primary)' }}>
                  Create Expense Group
                </h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Group Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Manali Winter Trek 🏔️"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs font-medium p-2.5 rounded-xl border outline-none"
                  style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Type / Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as GroupCategory)}
                    className="w-full text-xs font-medium p-2.5 rounded-xl border outline-none"
                    style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                  >
                    <option value="trip">🌴 Trip & Vacation</option>
                    <option value="home">🏠 House & Roommates</option>
                    <option value="couple">❤️ Couple</option>
                    <option value="office">💼 Office & Work</option>
                    <option value="event">🎉 Event & Celebration</option>
                    <option value="other">📦 Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Default Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as Currency)}
                    className="w-full text-xs font-medium p-2.5 rounded-xl border outline-none"
                    style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                  >
                    <option value="INR">₹ INR (Indian Rupee)</option>
                    <option value="USD">$ USD (US Dollar)</option>
                    <option value="EUR">€ EUR (Euro)</option>
                    <option value="GBP">£ GBP (British Pound)</option>
                    <option value="CAD">CA$ CAD (Canadian Dollar)</option>
                    <option value="AUD">AU$ AUD (Australian Dollar)</option>
                    <option value="JPY">¥ JPY (Japanese Yen)</option>
                  </select>
                </div>
              </div>

              {/* Cover Gradient Picker */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Theme Accent
                </label>
                <div className="flex gap-2">
                  {GRADIENTS.map((g, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCoverGradient(g)}
                      className={`h-8 flex-1 rounded-xl bg-gradient-to-r ${g} transition-all ${
                        coverGradient === g ? 'ring-2 ring-indigo-500 scale-105' : 'opacity-70'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Member Selection */}
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Add Members ({selectedUserIds.length})
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-1">
                  {allUsers.map((u) => {
                    const isSelected = selectedUserIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (selectedUserIds.length > 1) {
                              setSelectedUserIds(selectedUserIds.filter((id) => id !== u.id));
                            }
                          } else {
                            setSelectedUserIds([...selectedUserIds, u.id]);
                          }
                        }}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-medium text-left transition-all ${
                          isSelected ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : 'border-transparent text-gray-400'
                        }`}
                        style={{ background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--border-subtle)' }}
                      >
                        <img src={u.avatar} alt={u.name} className="w-5 h-5 rounded-md object-cover" />
                        <span className="truncate">{u.id === currentUser.id ? 'You' : u.name.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            <div className="mt-5 pt-3 border-t flex items-center justify-end gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl text-gray-400"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!name.trim()}
                onClick={handleCreate}
                className="gradient-btn px-4 py-2 text-xs font-semibold"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
