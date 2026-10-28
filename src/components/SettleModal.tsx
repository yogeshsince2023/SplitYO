import React, { useState, useEffect } from 'react';
import { Currency, Settlement, User } from '../types';
import { formatMoney } from '../engine/expenseEngine';
import { generateUpiUri, generateQrSvgDataUrl } from '../engine/upiGenerator';
import { 
  X, 
  QrCode, 
  Send, 
  Banknote, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Smartphone
} from 'lucide-react';

interface SettleModalProps {
  fromUser: User;
  toUser: User;
  suggestedAmountMinor: number;
  currency: Currency;
  groupId: string;
  onClose: () => void;
  onConfirmSettlement: (settlement: Omit<Settlement, 'id' | 'date'>) => void;
}

export const SettleModal: React.FC<SettleModalProps> = ({
  fromUser,
  toUser,
  suggestedAmountMinor,
  currency,
  groupId,
  onClose,
  onConfirmSettlement,
}) => {
  const [amountStr, setAmountStr] = useState<string>(
    (suggestedAmountMinor / 100).toFixed(2),
  );
  const [method, setMethod] = useState<'upi' | 'cash' | 'bank_transfer'>('upi');
  const [notes, setNotes] = useState<string>('');
  const [showQr, setShowQr] = useState<boolean>(true);
  const [submitted, setSubmitted] = useState<boolean>(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const amountMinor = Math.round(parseFloat(amountStr || '0') * 100);

  const upiUri = toUser.upiId
    ? generateUpiUri({
        upiId: toUser.upiId,
        payeeName: toUser.name,
        amountMinor,
        currency,
        note: notes || 'SplitMate settlement',
      })
    : '';

  const qrUrl = upiUri ? generateQrSvgDataUrl(upiUri) : '';

  const handleConfirm = () => {
    if (amountMinor <= 0) return;
    setSubmitted(true);
    setTimeout(() => {
      onConfirmSettlement({
        groupId,
        fromUserId: fromUser.id,
        toUserId: toUser.id,
        amountMinor,
        currency,
        method,
        notes: notes || `Settlement paid via ${method.toUpperCase()}`,
        confirmed: true,
      });
      onClose();
    }, 600);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-modal-pop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settle-modal-title"
    >
      <div 
        className="glass-panel w-full max-w-md p-5 sm:p-6 relative overflow-hidden"
        style={{ background: 'var(--bg-surface)' }}
      >
        {/* Mobile Sheet Drag Handle */}
        <div className="w-12 h-1.5 bg-gray-400/30 rounded-full mx-auto mb-3 sm:hidden" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-500/15 text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 id="settle-modal-title" className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                Settle Balance
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Direct settlement with zero fees
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-500/10 transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Transfer Visual */}
        <div className="my-5 flex items-center justify-between p-3.5 rounded-2xl" style={{ background: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2.5">
            <img src={fromUser.avatar} alt={fromUser.name} className="w-10 h-10 rounded-xl object-cover" />
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{fromUser.name}</p>
              <span className="text-[10px] text-rose-500 font-medium">Payer</span>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-emerald-500 mb-1">
              {formatMoney(amountMinor, currency)}
            </span>
            <div className="w-8 h-8 rounded-full bg-indigo-500/15 flex items-center justify-center text-indigo-400">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-right">
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{toUser.name}</p>
              <span className="text-[10px] text-emerald-500 font-medium">Recipient</span>
            </div>
            <img src={toUser.avatar} alt={toUser.name} className="w-10 h-10 rounded-xl object-cover" />
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-4">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Settlement Amount ({currency})
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="w-full text-xl font-bold px-4 py-2.5 rounded-xl border transition-all outline-none"
              style={{
                background: 'var(--bg-primary)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              onClick={() => setAmountStr((suggestedAmountMinor / 100).toFixed(2))}
              className="absolute right-2 top-2 px-2.5 py-1 text-xs rounded-lg font-medium text-indigo-400 hover:bg-indigo-500/10 transition-colors"
            >
              Full Balance
            </button>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="mb-4">
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            Payment Method
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'upi', label: 'UPI / QR', icon: QrCode },
              { id: 'cash', label: 'Cash', icon: Banknote },
              { id: 'bank_transfer', label: 'Bank Transfer', icon: Send },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = method === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id as any)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition-all ${
                    isSelected ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : 'border-transparent hover:bg-gray-500/5'
                  }`}
                  style={{
                    background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--border-subtle)',
                    color: isSelected ? 'var(--brand-primary)' : 'var(--text-secondary)',
                    borderColor: isSelected ? 'var(--brand-primary)' : 'transparent',
                  }}
                >
                  <Icon className="w-4 h-4 mb-1" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* UPI QR Code Section */}
        {method === 'upi' && (
          <div className="mb-4 p-4 rounded-2xl border text-center" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-primary)' }}>
            {toUser.upiId ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5" /> UPI ID: {toUser.upiId}
                  </span>
                  <button 
                    onClick={() => setShowQr(!showQr)}
                    className="text-[11px] text-gray-400 hover:text-indigo-400 underline"
                  >
                    {showQr ? 'Hide QR' : 'Show QR'}
                  </button>
                </div>

                {showQr && (
                  <div className="p-3 bg-white rounded-xl inline-block shadow-md my-1">
                    <img src={qrUrl} alt="UPI QR Code" className="w-36 h-36 mx-auto object-contain" />
                  </div>
                )}

                <div className="mt-2">
                  <a
                    href={upiUri}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl text-white shadow-sm"
                    style={{ background: 'var(--brand-gradient)' }}
                  >
                    <Smartphone className="w-3.5 h-3.5" /> Open in UPI App (GPay / PhonePe)
                  </a>
                </div>
              </>
            ) : (
              <div className="text-xs py-2 text-gray-400">
                {toUser.name} has not linked a UPI ID yet. You can still settle with Cash or Bank Transfer.
              </div>
            )}
          </div>
        )}

        {/* Optional Note */}
        <div className="mb-5">
          <input
            type="text"
            placeholder="Add note (e.g. Sent via GPay ref #123456)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full text-xs px-3.5 py-2 rounded-xl border outline-none"
            style={{
              background: 'var(--bg-primary)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-colors"
            style={{
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            Cancel
          </button>
          <button
            disabled={amountMinor <= 0 || submitted}
            onClick={handleConfirm}
            className="flex-1 gradient-btn py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{submitted ? 'Recording...' : 'Record Payment'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
