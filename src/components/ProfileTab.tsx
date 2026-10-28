import React, { useState } from 'react';
import { User } from '../types';
import { 
  ShieldCheck, 
  Check, 
  Download, 
  Smartphone, 
  RotateCcw,
  CreditCard,
  HardDrive,
  Copy
} from 'lucide-react';
import { triggerFileDownload } from '../engine/offlineStore';

interface ProfileTabProps {
  currentUser: User;
  onUpdateUserUpi: (newUpi: string) => void;
  onResetData: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  currentUser,
  onUpdateUserUpi,
  onResetData,
}) => {
  const [upiInput, setUpiInput] = useState(currentUser.upiId || '');
  const [savedUpi, setSavedUpi] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const handleSaveUpi = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUserUpi(upiInput.trim());
    setSavedUpi(true);
    setTimeout(() => setSavedUpi(false), 2000);
  };

  const handleCopyUpi = () => {
    if (!currentUser.upiId) return;
    navigator.clipboard?.writeText(currentUser.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleExportAll = () => {
    const raw = localStorage.getItem('splitmate_data_v1');
    if (raw) {
      triggerFileDownload('SplitMate_Complete_Backup.json', raw, 'application/json');
    }
  };

  return (
    <div className="space-y-4 pb-20 max-w-xl mx-auto">
      {/* 1. User Profile Card */}
      <div className="glass-panel p-4 flex items-center gap-3.5">
        <img
          src={currentUser.avatar}
          alt={currentUser.name}
          className="w-14 h-14 rounded-2xl object-cover ring-2 ring-indigo-500/40 shadow-md flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold text-base truncate" style={{ color: 'var(--text-primary)' }}>
              {currentUser.name}
            </h3>
            <span className="badge badge-brand text-[9px] px-1.5 py-0.2">Active</span>
          </div>
          <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
            {currentUser.email}
          </p>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono text-indigo-400">
            <CreditCard className="w-3 h-3" />
            <span className="truncate">{currentUser.upiId || 'No UPI ID set'}</span>
            {currentUser.upiId && (
              <button 
                onClick={handleCopyUpi} 
                className="hover:opacity-80 p-0.5 ml-1"
                title="Copy UPI ID"
              >
                {copiedUpi ? <Check className="w-3 h-3 text-indigo-400" /> : <Copy className="w-3 h-3 text-gray-400" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. UPI VPA Payment Configuration */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
            <Smartphone className="w-3.5 h-3.5" />
          </div>
          <h4 className="font-display font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
            UPI Settlement Coordinates
          </h4>
        </div>

        <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
          Your friends will settle dues directly to this UPI address with zero gateway cuts or processing delays.
        </p>

        <form onSubmit={handleSaveUpi} className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. username@okhdfcbank"
              value={upiInput}
              onChange={(e) => setUpiInput(e.target.value)}
              className="flex-1 text-xs font-medium px-3 py-2 rounded-xl border outline-none font-mono"
              style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
            />
            <button
              type="submit"
              className="gradient-btn px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              {savedUpi ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" /> Saved
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 3. Data & Storage Settings */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-violet-500/15 text-violet-400 flex items-center justify-center">
            <HardDrive className="w-3.5 h-3.5" />
          </div>
          <h4 className="font-display font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
            Data & Offline Storage
          </h4>
        </div>

        <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
          SplitMate stores all ledger records locally with deterministic balance reconciliation.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            onClick={handleExportAll}
            className="flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors hover:bg-gray-500/10"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" /> Export JSON Backup
          </button>

          <button
            onClick={() => {
              if (window.confirm('Reset local database back to default initial state?')) {
                onResetData();
              }
            }}
            className="py-2 px-3 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Demo Data
          </button>
        </div>
      </div>

      {/* 4. App Info & Features */}
      <div className="p-3 text-center space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>SplitMate Mobile v2.4.0</span>
        </div>
        <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
          100% Free · No Paywalls · Unlimited Expenses · Zero Floating-Point Errors
        </p>
      </div>
    </div>
  );
};
