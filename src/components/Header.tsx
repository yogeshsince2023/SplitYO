import React from 'react';
import { User, SyncStatus } from '../types';
import { 
  Sun, 
  Moon, 
  ChevronDown, 
  ShieldCheck,
  Zap,
  Settings
} from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  allUsers: User[];
  onSwitchUser: (userId: string) => void;
  syncStatus: SyncStatus;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenAddExpense?: () => void;
  onSelectTab?: (tab: 'profile') => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  allUsers,
  onSwitchUser,
  syncStatus,
  isDark,
  onToggleTheme,
  onOpenAddExpense: _onOpenAddExpense,
  onSelectTab,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);

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
        {/* Left: User Profile Dropdown */}
        <div className="relative">
          <button
            id="header-user-btn"
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 p-1 pr-2.5 rounded-full transition-all"
            style={{ 
              background: 'var(--bg-surface-elevated)',
            }}
            aria-label="Current User"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-7 h-7 rounded-full object-cover"
              style={{ boxShadow: '0 0 0 2px rgba(99,102,241,0.5)' }}
            />
            <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
              {currentUser.name.split(' ')[0]}
            </span>
            <ChevronDown className="w-3 h-3" style={{ color: 'var(--text-tertiary)' }} />
          </button>

          {userDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setUserDropdownOpen(false)} 
              />
              <div
                className="absolute left-0 mt-2 w-52 glass-panel py-2 z-50 animate-modal-pop shadow-2xl"
                style={{ background: 'var(--bg-surface)' }}
              >
                <div className="px-3 py-1 border-b mb-1 text-[10px] font-semibold uppercase tracking-wider" 
                  style={{ color: 'var(--text-tertiary)', borderColor: 'var(--border-subtle)' }}>
                  Switch User
                </div>
                {allUsers.map((u) => (
                  <button
                    key={u.id}
                    id={`user-option-${u.id}`}
                    onClick={() => {
                      onSwitchUser(u.id);
                      setUserDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors ${
                      u.id === currentUser.id ? 'bg-indigo-500/15 font-bold' : 'hover:bg-gray-500/10'
                    }`}
                    style={{ color: u.id === currentUser.id ? 'var(--brand-primary)' : 'var(--text-primary)' }}
                  >
                    <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full object-cover" />
                    <div className="truncate flex-1 min-w-0">
                      <div className="truncate font-semibold">{u.name}</div>
                      {u.upiId && <div className="text-[10px] truncate" style={{ color: 'var(--text-tertiary)' }}>{u.upiId}</div>}
                    </div>
                    {u.id === currentUser.id && <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 text-indigo-400" />}
                  </button>
                ))}

                {onSelectTab && (
                  <div className="pt-1 mt-1 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                    <button
                      id="header-goto-settings-btn"
                      onClick={() => {
                        onSelectTab('profile');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold hover:bg-gray-500/10 transition-colors"
                      style={{ color: 'var(--brand-primary)' }}
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>My Profile & Settings</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
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
