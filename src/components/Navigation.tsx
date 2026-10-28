import React from 'react';
import { 
  Home, 
  Users, 
  Plus, 
  PieChart, 
  History 
} from 'lucide-react';

export type TabType = 'dashboard' | 'groups' | 'insights' | 'activity' | 'profile';

interface NavigationProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenAddExpense: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  onOpenAddExpense,
}) => {
  const tabs = [
    { id: 'dashboard' as TabType, label: 'Home', icon: Home },
    { id: 'groups' as TabType, label: 'Groups', icon: Users },
    { id: 'add_expense' as const, label: 'Add', icon: Plus, isAction: true },
    { id: 'insights' as TabType, label: 'Insights', icon: PieChart },
    { id: 'activity' as TabType, label: 'Activity', icon: History },
  ];

  return (
    <nav 
      style={{ 
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        flexShrink: 0,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="w-full px-2 py-1.5 flex items-center justify-around">
        {tabs.map((tab) => {
          if ('isAction' in tab && tab.isAction) {
            return (
              <button
                key="fab-add"
                id="nav-tab-add"
                onClick={onOpenAddExpense}
                className="gradient-btn w-12 h-12 -mt-5 rounded-full flex items-center justify-center transition-transform active:scale-95"
                style={{ 
                  boxShadow: '0 6px 16px rgba(99, 102, 241, 0.4)',
                  border: '3px solid var(--bg-surface)' 
                }}
                title="Add Expense"
                aria-label="Add Expense"
              >
                <Plus className="w-6 h-6 text-white" style={{ strokeWidth: 2.5 }} />
              </button>
            );
          }

          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onSelectTab(tab.id as TabType)}
              className="flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all"
              style={{
                color: isActive ? 'var(--brand-primary)' : 'var(--text-tertiary)',
              }}
              aria-label={tab.label}
            >
              <div 
                className="p-1.5 rounded-xl transition-colors"
                style={{
                  background: isActive ? 'rgba(99, 102, 241, 0.14)' : 'transparent',
                }}
              >
                <Icon className="w-5 h-5" style={{ strokeWidth: isActive ? 2.5 : 2 }} />
              </div>
              <span className="text-[10px] mt-0.5 font-medium" style={{ fontWeight: isActive ? 700 : 500 }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
