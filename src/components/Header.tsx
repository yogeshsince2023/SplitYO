import React from 'react';
import { User, SyncStatus } from '../types';
import { 
  Sun, 
  Moon, 
  Zap 
} from 'lucide-react';

interface HeaderProps {
  currentUser?: User;
  allUsers?: User[];
  onSwitchUser?: (userId: string) => void;
  syncStatus: SyncStatus;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenAddExpense?: () => void;
  onSelectTab?: (tab: 'profile') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  syncStatus,
  isDark,
  onToggleTheme,
  onOpenAddExpense: _onOpenAddExpense,
  onSelectTab,
}) => {
  return (
    <header 
      className="w-full border-b"
      style={{ 
        background: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
        flexShrink: 0,
      }}
    >
      <div className="w-full px-4 h-14 flex items-center justify-between">
        {/* Left: User Profile Button */}
        <div className="relative">
          <button
            id="header-user-btn"
            onClick={() => onSelectTab && onSelectTab('profile')}
            className="flex items-center gap-2 p-1 pr-3 rounded-full transition-all hover:bg-white/10 active:scale-95"
            style={{ 
              background: 'var(--bg-surface-elevated)',
            }}
            aria-label="My Profile and Settings"
            title="My Profile & Settings"
          >
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover"
                style={{ boxShadow: '0 0 0 2px rgba(99,102,241,0.5)' }}
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white"
                style={{ background: 'var(--brand-gradient)' }}
              >
                {currentUser?.name ? currentUser.name[0].toUpperCase() : 'U'}
              </div>
            )}
            <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
              {currentUser?.name ? currentUser.name.split(' ')[0] : 'Profile'}
            </span>
          </button>
        </div>

        {/* Center: Brand Name */}
        <div className="flex items-center gap-1.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm" style={{ background: 'var(--brand-gradient)' }}>
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-display font-extrabold text-base tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Split<span style={{ color: 'var(--brand-primary)' }}>Mate</span>
          </span>
        </div>

        {/* Right: Sync Status & Theme Toggle */}
        <div className="flex items-center gap-2">
          <div 
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
            style={{
              borderColor: 'var(--border-subtle)',
              background: 'var(--bg-surface-elevated)',
              color: syncStatus.isOnline ? '#10b981' : '#f59e0b',
            }}
            title={syncStatus.isOnline ? 'Online — Real-time synced' : 'Offline — Saved to local storage'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${syncStatus.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="hidden sm:inline">{syncStatus.isOnline ? 'Synced' : 'Offline'}</span>
          </div>

          <button
            id="header-theme-btn"
            onClick={onToggleTheme}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'var(--bg-surface-elevated)', color: 'var(--text-primary)' }}
            title="Toggle Theme"
            aria-label="Toggle Dark/Light Mode"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>
        </div>
      </div>
    </header>
  );
};
