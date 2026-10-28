import React, { useState, useEffect, useRef } from 'react';
import { 
  Currency, 
  Expense, 
  Group, 
  Settlement, 
  SyncStatus,
  User 
} from './types';
import { 
  loadAppState, 
  saveAppState, 
  generateUserAvatarSvg 
} from './engine/offlineStore';
import { RegisterModal } from './components/RegisterModal';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { DashboardTab } from './components/DashboardTab';
import { GroupsTab } from './components/GroupsTab';
import { GroupDetailModal } from './components/GroupDetailModal';
import { AddExpenseModal } from './components/AddExpenseModal';
import { SettleModal } from './components/SettleModal';
import { InsightsTab } from './components/InsightsTab';
import { ActivityTab } from './components/ActivityTab';
import { ProfileTab } from './components/ProfileTab';

export function App() {
  const [state, setState] = useState(() => loadAppState());
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isDark, setIsDark] = useState<boolean>(true);

  // Modals state
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [addExpenseGroupId, setAddExpenseGroupId] = useState<string | undefined>(undefined);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Settlement modal state
  const [settleDetails, setSettleDetails] = useState<{
    fromUserId: string;
    toUserId: string;
    suggestedAmountMinor: number;
    currency: Currency;
    groupId: string;
  } | null>(null);

  // Online / Offline synchronization state
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  // Independent scroll refs for each tab
  const scrollRefs = {
    dashboard: useRef<HTMLDivElement>(null),
    groups: useRef<HTMLDivElement>(null),
    insights: useRef<HTMLDivElement>(null),
    activity: useRef<HTMLDivElement>(null),
    profile: useRef<HTMLDivElement>(null),
  };

  // Sync state to local storage whenever state changes
  useEffect(() => {
    saveAppState(state);
  }, [state]);

  // Handle theme changes
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Online / offline network event listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const currentUser: User = state.users.find((u) => u.id === state.currentUserId) || state.users[0] || {
    id: '',
    name: '',
    email: '',
    avatar: '',
  };
  const activeSelectedGroup = state.groups.find((g) => g.id === selectedGroupId) || null;

  // Handlers
  const handleRegisterUser = (name: string, upiId: string, email: string, _defaultCurrency: Currency) => {
    const newUserId = `usr_${Date.now()}`;
    const newUser: User = {
      id: newUserId,
      name,
      email: email || `${name.toLowerCase().replace(/\s+/g, '')}@device.local`,
      avatar: generateUserAvatarSvg(name),
      upiId: upiId || undefined,
    };
    const welcomeActivity = [
      {
        id: `act_${Date.now()}`,
        groupId: '',
        type: 'member_joined' as const,
        actorId: newUserId,
        summary: `Welcome to SplitMate! Device profile registered for ${name}.`,
        timestamp: new Date().toISOString(),
      },
    ];
    setState((prev) => ({
      ...prev,
      currentUserId: newUserId,
      users: [newUser],
      activity: welcomeActivity,
    }));
  };

  const handleAddUser = (name: string, upiId?: string): User => {
    const cleanName = name.trim();
    const existing = state.users.find((u) => u.name.toLowerCase() === cleanName.toLowerCase());
    if (existing) return existing;

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName,
      email: `${cleanName.toLowerCase().replace(/\s+/g, '')}@device.local`,
      avatar: generateUserAvatarSvg(cleanName),
      upiId: upiId || undefined,
    };

    setState((prev) => ({
      ...prev,
      users: [...prev.users, newUser],
    }));
    return newUser;
  };

  const handleOpenAddExpense = (groupId?: string) => {
    setAddExpenseGroupId(groupId);
    setShowAddExpense(true);
  };

  const handleSaveExpense = (newExpData: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...newExpData,
      id: `exp_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const targetGroup = state.groups.find((g) => g.id === newExpData.groupId);
    const activityItem = {
      id: `act_${Date.now()}`,
      groupId: newExpData.groupId,
      type: 'expense_created' as const,
      actorId: state.currentUserId,
      summary: `${currentUser.name} added "${newExpData.title}" (${(newExpData.totalMinor / 100).toFixed(2)} ${newExpData.currency}) to ${targetGroup?.name || 'group'}`,
      timestamp: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      expenses: [newExpense, ...prev.expenses],
      activity: [activityItem, ...prev.activity],
    }));
  };

  const handleReverseExpense = (expenseId: string) => {
    const target = state.expenses.find((e) => e.id === expenseId);
    if (!target) return;

    const activityItem = {
      id: `act_${Date.now()}`,
      groupId: target.groupId,
      type: 'expense_reversed' as const,
      actorId: state.currentUserId,
      summary: `${currentUser.name} reversed expense "${target.title}"`,
      timestamp: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) =>
        e.id === expenseId ? { ...e, isReversed: true } : e,
      ),
      activity: [activityItem, ...prev.activity],
    }));
  };

  const handleConfirmSettlement = (data: Omit<Settlement, 'id' | 'date'>) => {
    const newSettlement: Settlement = {
      ...data,
      id: `stl_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    };

    const fromUser = state.users.find((u) => u.id === data.fromUserId);
    const toUser = state.users.find((u) => u.id === data.toUserId);

    const activityItem = {
      id: `act_${Date.now()}`,
      groupId: data.groupId,
      type: 'settlement_recorded' as const,
      actorId: state.currentUserId,
      summary: `${fromUser?.name || 'User'} paid ${(data.amountMinor / 100).toFixed(2)} ${data.currency} to ${toUser?.name || 'User'} (${data.method.toUpperCase()})`,
      timestamp: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      settlements: [newSettlement, ...prev.settlements],
      activity: [activityItem, ...prev.activity],
    }));
  };

  const handleCreateGroup = (groupData: Omit<Group, 'id' | 'createdAt' | 'inviteCode'>) => {
    const newGroup: Group = {
      ...groupData,
      id: `grp_${Date.now()}`,
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      createdAt: new Date().toISOString(),
    };

    const activityItem = {
      id: `act_${Date.now()}`,
      groupId: newGroup.id,
      type: 'member_joined' as const,
      actorId: state.currentUserId,
      summary: `${currentUser.name} created group "${newGroup.name}"`,
      timestamp: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      groups: [newGroup, ...prev.groups],
      activity: [activityItem, ...prev.activity],
    }));
  };

  const handleUpdateUserUpi = (newUpi: string) => {
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) =>
        u.id === state.currentUserId ? { ...u, upiId: newUpi } : u,
      ),
    }));
  };

  const handleResetData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('splitmate_data_v1');
    }
    setState({
      currentUserId: '',
      users: [],
      groups: [],
      expenses: [],
      settlements: [],
      recurringBills: [],
      activity: [],
      pendingSyncQueue: [],
    });
  };

  const syncStatus: SyncStatus = {
    isOnline,
    pendingCount: state.pendingSyncQueue.length,
    lastSyncedAt: state.activity[0]?.timestamp ? state.activity[0].timestamp.substring(11, 16) : 'Synced',
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  // Tab content renderer — each tab gets its own scroll container
  const renderTabContent = (tab: TabType) => {
    switch (tab) {
      case 'dashboard':
        return (
          <DashboardTab
            currentUser={currentUser}
            allUsers={state.users}
            groups={state.groups}
            expenses={state.expenses}
            settlements={state.settlements}
            onSelectGroup={(gid) => setSelectedGroupId(gid)}
            onOpenSettleModal={(fromId, toId, amt, curr, gid) =>
              setSettleDetails({
                fromUserId: fromId,
                toUserId: toId,
                suggestedAmountMinor: amt,
                currency: curr,
                groupId: gid,
              })
            }
            onOpenAddExpense={() => handleOpenAddExpense()}
            onNavigateTab={(targetTab) => setActiveTab(targetTab)}
          />
        );
      case 'groups':
        return (
          <GroupsTab
            groups={state.groups}
            currentUser={currentUser}
            allUsers={state.users}
            expenses={state.expenses}
            settlements={state.settlements}
            onSelectGroup={(gid) => setSelectedGroupId(gid)}
            onCreateGroup={handleCreateGroup}
            onOpenAddExpense={handleOpenAddExpense}
            onAddUser={handleAddUser}
          />
        );
      case 'insights':
        return (
          <InsightsTab
            currentUser={currentUser}
            allUsers={state.users}
            groups={state.groups}
            expenses={state.expenses}
          />
        );
      case 'activity':
        return (
          <ActivityTab
            activity={state.activity}
            settlements={state.settlements}
            allUsers={state.users}
            groups={state.groups}
          />
        );
      case 'profile':
        return (
          <ProfileTab
            currentUser={currentUser}
            onUpdateUserUpi={handleUpdateUserUpi}
            onResetData={handleResetData}
          />
        );
    }
  };

  const allTabs: TabType[] = ['dashboard', 'groups', 'insights', 'activity', 'profile'];

  return (
    <div className="app-shell">
      {/* App Header */}
      <Header
        currentUser={currentUser}
        syncStatus={syncStatus}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        onOpenAddExpense={() => handleOpenAddExpense()}
        onSelectTab={(tab) => setActiveTab(tab)}
      />

      {/* Tab Content — each tab has its own independent scroll container */}
      <div className="app-content-area">
        {allTabs.map((tab) => (
          <div
            key={tab}
            ref={scrollRefs[tab]}
            className={`app-tab-scroll ${activeTab === tab ? 'app-tab-active' : 'app-tab-hidden'}`}
          >
            <div className="app-tab-inner">
              {renderTabContent(tab)}
            </div>
          </div>
        ))}
      </div>

      {/* Fixed Bottom Navigation */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={handleTabChange}
        onOpenAddExpense={() => handleOpenAddExpense()}
      />

      {/* Add Expense Modal */}
      {showAddExpense && (
        <AddExpenseModal
          groups={state.groups}
          users={state.users}
          currentUserId={state.currentUserId}
          defaultGroupId={addExpenseGroupId}
          onClose={() => {
            setShowAddExpense(false);
            setAddExpenseGroupId(undefined);
          }}
          onSaveExpense={handleSaveExpense}
        />
      )}

      {/* Group Detail Modal */}
      {activeSelectedGroup && (
        <GroupDetailModal
          group={activeSelectedGroup}
          currentUser={currentUser}
          allUsers={state.users}
          expenses={state.expenses}
          settlements={state.settlements}
          recurringBills={state.recurringBills}
          onClose={() => setSelectedGroupId(null)}
          onOpenAddExpense={handleOpenAddExpense}
          onOpenSettleModal={(fromId, toId, amt, curr, gid) =>
            setSettleDetails({
              fromUserId: fromId,
              toUserId: toId,
              suggestedAmountMinor: amt,
              currency: curr,
              groupId: gid,
            })
          }
          onReverseExpense={handleReverseExpense}
        />
      )}

      {/* Settle Up Modal */}
      {settleDetails && (
        <SettleModal
          fromUser={state.users.find((u) => u.id === settleDetails.fromUserId) || currentUser}
          toUser={state.users.find((u) => u.id === settleDetails.toUserId) || currentUser}
          suggestedAmountMinor={settleDetails.suggestedAmountMinor}
          currency={settleDetails.currency}
          groupId={settleDetails.groupId}
          onClose={() => setSettleDetails(null)}
          onConfirmSettlement={handleConfirmSettlement}
        />
      )}

      {/* Registration / Device Onboarding Modal for First-time Users */}
      {(!state.currentUserId || state.users.length === 0) && (
        <RegisterModal onRegister={handleRegisterUser} />
      )}
    </div>
  );
}

export default App;
