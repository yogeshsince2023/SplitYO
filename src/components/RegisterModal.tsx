import React, { useState } from 'react';
import { Currency } from '../types';
import { Sparkles, Smartphone, ShieldCheck, ArrowRight, User } from 'lucide-react';

interface RegisterModalProps {
  onRegister: (name: string, upiId: string, email: string, defaultCurrency: Currency) => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({ onRegister }) => {
  const [name, setName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [email, setEmail] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState<Currency>('INR');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name to set up your profile.');
      return;
    }
    onRegister(name.trim(), upiId.trim(), email.trim(), defaultCurrency);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-modal-pop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-modal-title"
    >
      <div 
        className="glass-panel w-full max-w-md p-6 relative overflow-hidden shadow-2xl border"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-highlight)' }}
      >
        {/* Glow Accent */}
        <div 
          className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-2xl pointer-events-none opacity-40"
          style={{ background: 'var(--brand-primary)' }}
        />

        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md" style={{ background: 'var(--brand-gradient)' }}>
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 id="register-modal-title" className="font-display font-extrabold text-xl" style={{ color: 'var(--text-primary)' }}>
              Welcome to SplitMate
            </h2>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-500">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Private · Stored on your device</span>
            </div>
          </div>
        </div>

        <p className="text-xs mb-5 leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
          Create your profile to get started. All your groups, expenses, and UPI coordinates are stored safely on your phone without sharing personal data to external servers.
        </p>

        {error && (
          <div className="mb-4 p-2.5 rounded-xl text-xs font-semibold bg-rose-500/15 border border-rose-500/30 text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
              Your Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. Alex Sharma"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full text-xs font-medium pl-9 pr-3 py-2.5 rounded-xl border outline-none"
                style={{ 
                  background: 'var(--bg-primary)', 
                  borderColor: 'var(--border-subtle)', 
                  color: 'var(--text-primary)' 
                }}
                autoFocus
              />
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
              Your UPI ID / VPA <span className="text-gray-400 text-[10px]">(Optional — for receiving settlement payments)</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. yourname@oksbi or mobile@paytm"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full text-xs font-medium pl-9 pr-3 py-2.5 rounded-xl border outline-none font-mono"
                style={{ 
                  background: 'var(--bg-primary)', 
                  borderColor: 'var(--border-subtle)', 
                  color: 'var(--text-primary)' 
                }}
              />
              <Smartphone className="w-4 h-4 text-indigo-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                Email / Phone <span className="text-gray-400 text-[10px]">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="Local reference"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border outline-none"
                style={{ 
                  background: 'var(--bg-primary)', 
                  borderColor: 'var(--border-subtle)', 
                  color: 'var(--text-primary)' 
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                Default Currency
              </label>
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value as Currency)}
                className="w-full text-xs font-medium px-3 py-2.5 rounded-xl border outline-none"
                style={{ 
                  background: 'var(--bg-primary)', 
                  borderColor: 'var(--border-subtle)', 
                  color: 'var(--text-primary)' 
                }}
              >
                <option value="INR">₹ INR (Rupee)</option>
                <option value="USD">$ USD (Dollar)</option>
                <option value="EUR">€ EUR (Euro)</option>
                <option value="GBP">£ GBP (Pound)</option>
                <option value="CAD">CA$ CAD</option>
                <option value="AUD">AU$ AUD</option>
                <option value="JPY">¥ JPY</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full gradient-btn py-3 text-xs font-bold flex items-center justify-center gap-2 rounded-xl shadow-lg mt-2 cursor-pointer transition-transform active:scale-98"
          >
            <span>Create Profile & Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
