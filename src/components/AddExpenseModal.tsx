import React, { useState, useEffect } from 'react';
import { Currency, Expense, Group, ReceiptItem, SplitType, User } from '../types';
import { 
  formatMoney, 
  parseMoneyToMinor, 
  calculateEqualSplit, 
  calculatePercentageSplit, 
  calculateSharesSplit, 
  calculateItemizedSplit,
  validateSplits 
} from '../engine/expenseEngine';
import { CATEGORIES, detectCategoryFromTitle } from '../engine/categoryHelper';
import { parseNaturalLanguageExpense, simulateReceiptOCR } from '../engine/aiParser';
import { 
  X, 
  Sparkles, 
  Mic, 
  Receipt, 
  Check, 
  AlertCircle,
  Plus
} from 'lucide-react';

interface AddExpenseModalProps {
  groups: Group[];
  users: User[];
  currentUserId: string;
  defaultGroupId?: string;
  onClose: () => void;
  onSaveExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  onAddUser?: (name: string) => User;
  onCreateGroup?: (group: Omit<Group, 'id' | 'createdAt' | 'inviteCode'>) => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  groups,
  users,
  currentUserId,
  defaultGroupId,
  onClose,
  onSaveExpense,
  onAddUser,
  onCreateGroup,
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    defaultGroupId || groups[0]?.id || '',
  );

  // Quick group creation for zero-group state
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreatingQuickGroup, setIsCreatingQuickGroup] = useState(groups.length === 0);

  // New friend quick add
  const [newPersonName, setNewPersonName] = useState('');
  const [showAddPersonInput, setShowAddPersonInput] = useState(false);

  // Entry Mode: 'form' | 'ai_text' | 'receipt_ocr'
  const [entryMode, setEntryMode] = useState<'form' | 'ai_text' | 'receipt_ocr'>('form');

  // Form Details
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Determine current active group & members
  const activeGroup = groups.find((g) => g.id === selectedGroupId) || groups[0];
  const currency: Currency = activeGroup?.currency || 'INR';

  // Available participants: members of active group, or all known users
  const availableMembers = activeGroup
    ? users.filter((u) => activeGroup.members.some((m) => m.userId === u.id))
    : users;

  // Selected participants in this expense
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>(() => {
    if (availableMembers.length > 0) {
      return availableMembers.map((m) => m.id);
    }
    return [currentUserId];
  });

  // Payer (default: current user)
  const [payerId, setPayerId] = useState<string>(currentUserId);

  // Split Type & Allocations
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [shares, setShares] = useState<Record<string, string>>({});
  
  // Itemized Receipt Split
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [taxTipMinor, setTaxTipMinor] = useState<number>(0);

  // AI Voice & Text
  const [aiInputText, setAiInputText] = useState('');
  const [aiListening, setAiListening] = useState(false);

  // Validation Error
  const [validationError, setValidationError] = useState<string | null>(null);

  const totalMinor = parseMoneyToMinor(amountStr || '0', currency);

  // Handle Title Change with Smart Category Auto-Detection
  const handleTitleChange = (val: string) => {
    setTitle(val);
    setValidationError(null);
    if (val.trim().length >= 3) {
      const detected = detectCategoryFromTitle(val);
      if (detected !== 'General') {
        setCategory(detected);
      }
    }
  };

  // Add person dynamically
  const handleAddPerson = () => {
    if (!newPersonName.trim()) return;
    if (onAddUser) {
      const newUser = onAddUser(newPersonName.trim());
      if (!selectedParticipantIds.includes(newUser.id)) {
        setSelectedParticipantIds((prev) => [...prev, newUser.id]);
      }
    }
    setNewPersonName('');
    setShowAddPersonInput(false);
  };

  // Handle Natural Language Parse
  const handleApplyAiText = (text: string) => {
    if (!text.trim()) return;
    const draft = parseNaturalLanguageExpense(text, availableMembers, currentUserId, currency);
    setTitle(draft.title);
    setAmountStr((draft.totalMinor / 100).toFixed(2));
    setCategory(draft.category);
    if (draft.payerUserId) setPayerId(draft.payerUserId);
    if (draft.participantUserIds.length > 0) {
      setSelectedParticipantIds(draft.participantUserIds);
    }
    setSplitType('equal');
    setEntryMode('form');
  };

  // Handle Receipt OCR Simulation
  const handleRunReceiptOcr = () => {
    const receipt = simulateReceiptOCR('demo_receipt.jpg', currency);
    setTitle(receipt.merchant);
    setAmountStr((receipt.totalMinor / 100).toFixed(2));
    setCategory('Food');
    setReceiptItems(receipt.items);
    setTaxTipMinor(receipt.taxMinor + receipt.tipMinor);
    setSplitType('itemized');
    setEntryMode('form');
  };

  // Compute splits dynamically based on current configuration
  const computeCurrentSplits = () => {
    const participants = selectedParticipantIds.length > 0 ? selectedParticipantIds : [currentUserId];

    if (splitType === 'equal') {
      return calculateEqualSplit(totalMinor, participants);
    }

    if (splitType === 'exact') {
      return participants.map((uid) => ({
        userId: uid,
        amountMinor: parseMoneyToMinor(exactAmounts[uid] || '0', currency),
      }));
    }

    if (splitType === 'percentage') {
      const pcts = participants.map((uid) => ({
        userId: uid,
        percentage: parseFloat(percentages[uid] || '0'),
      }));
      return calculatePercentageSplit(totalMinor, pcts);
    }

    if (splitType === 'shares') {
      const shs = participants.map((uid) => ({
        userId: uid,
        shares: parseInt(shares[uid] || '1', 10),
      }));
      return calculateSharesSplit(totalMinor, shs);
    }

    if (splitType === 'itemized') {
      return calculateItemizedSplit(receiptItems, taxTipMinor, participants);
    }

    return [];
  };

  // Splitwise live summary calculation
  const calculatedSplits = computeCurrentSplits();
  const mySplitMinor = calculatedSplits.find((s) => s.userId === currentUserId)?.amountMinor || 0;
  const isPayerMe = payerId === currentUserId;
  const payerUser = users.find((u) => u.id === payerId);

  let summaryText = '';
  let summaryType: 'lent' | 'borrowed' | 'neutral' = 'neutral';

  if (totalMinor > 0) {
    if (isPayerMe) {
      const lentMinor = totalMinor - mySplitMinor;
      if (lentMinor > 0) {
        summaryText = `You paid ${formatMoney(totalMinor, currency)} and lent ${formatMoney(lentMinor, currency)}`;
        summaryType = 'lent';
      } else {
        summaryText = `You paid ${formatMoney(totalMinor, currency)} for yourself`;
        summaryType = 'neutral';
      }
    } else {
      if (mySplitMinor > 0) {
        summaryText = `${payerUser?.name || 'Friend'} paid ${formatMoney(totalMinor, currency)} and you owe ${formatMoney(mySplitMinor, currency)}`;
        summaryType = 'borrowed';
      } else {
        summaryText = `${payerUser?.name || 'Friend'} paid ${formatMoney(totalMinor, currency)} (you are not in this split)`;
        summaryType = 'neutral';
      }
    }
  }

  const handleSave = () => {
    if (!title.trim()) {
      setValidationError('Please enter an expense description.');
      return;
    }

    if (totalMinor <= 0) {
      setValidationError('Amount must be greater than zero.');
      return;
    }

    // Auto-create quick group if none existed
    let targetGroupId = selectedGroupId;
    if (!targetGroupId) {
      const groupTitle = newGroupName.trim() || 'General Expenses';
      if (onCreateGroup) {
        const participants = Array.from(new Set([currentUserId, ...selectedParticipantIds]));
        onCreateGroup({
          name: groupTitle,
          category: 'trip',
          currency,
          coverGradient: 'from-indigo-600 via-indigo-700 to-violet-800',
          members: participants.map((userId) => ({
            userId,
            role: userId === currentUserId ? 'owner' : 'member',
            joinedAt: new Date().toISOString(),
          })),
        });
      }
      targetGroupId = `grp_general_${Date.now()}`;
    }

    const validation = validateSplits(totalMinor, calculatedSplits, splitType);
    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid split distribution.');
      return;
    }

    onSaveExpense({
      groupId: targetGroupId,
      title: title.trim(),
      totalMinor,
      currency,
      category,
      date,
      notes: notes.trim() || undefined,
      payers: [{ userId: payerId, amountMinor: totalMinor }],
      splitType,
      splits: calculatedSplits,
      receiptItems: splitType === 'itemized' ? receiptItems : undefined,
      createdBy: currentUserId,
    });

    onClose();
  };

  const selectedCategoryMeta = CATEGORIES[category] || CATEGORIES.General;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-modal-pop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-expense-title"
    >
      <div 
        className="glass-panel w-full max-w-lg p-5 sm:p-6 relative rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto shadow-2xl border"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
      >
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1.5 bg-gray-500/30 rounded-full mx-auto mb-3 sm:hidden" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm" style={{ background: 'var(--brand-gradient)' }}>
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 id="add-expense-title" className="font-display font-extrabold text-lg" style={{ color: 'var(--text-primary)' }}>
                Add an Expense
              </h3>
              <p className="text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                Split fairly with zero floating-point rounding errors
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-500/10 text-gray-400 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 my-3 p-1 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
          <button
            onClick={() => setEntryMode('form')}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
              entryMode === 'form' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400'
            }`}
          >
            Standard Form
          </button>
          <button
            onClick={() => setEntryMode('ai_text')}
            className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              entryMode === 'ai_text' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400'
            }`}
          >
            <Sparkles className="w-3 h-3" /> AI Voice & Text
          </button>
          <button
            onClick={() => setEntryMode('receipt_ocr')}
            className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              entryMode === 'receipt_ocr' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400'
            }`}
          >
            <Receipt className="w-3 h-3" /> Scan Receipt
          </button>
        </div>

        {/* AI Voice & Text Mode */}
        {entryMode === 'ai_text' && (
          <div className="mb-4 p-4 rounded-2xl border bg-indigo-500/10 border-indigo-500/20">
            <div className="flex items-center gap-2 mb-1.5 text-indigo-400 font-semibold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>Smart Expense Voice / Text Parser</span>
            </div>
            <p className="text-[11px] text-gray-400 mb-3">
              Examples: <span className="italic text-gray-300">"Dinner ₹1200 paid by Priya for everyone"</span> or <span className="italic text-gray-300">"Uber $45 paid by me"</span>
            </p>
            <div className="relative">
              <textarea
                rows={2}
                value={aiInputText}
                onChange={(e) => setAiInputText(e.target.value)}
                placeholder="Say or type your expense..."
                className="w-full text-xs p-3 rounded-xl border outline-none pr-12 font-medium"
                style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
              />
              <button
                type="button"
                onClick={() => {
                  setAiListening(true);
                  setTimeout(() => {
                    setAiInputText(`Weekend team dinner ₹2,400 paid by me for all`);
                    setAiListening(false);
                  }, 1000);
                }}
                className={`absolute right-2.5 top-2.5 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  aiListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-indigo-500/20 text-indigo-400'
                }`}
                title="Tap to speak"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => handleApplyAiText(aiInputText)}
              disabled={!aiInputText.trim()}
              className="mt-2.5 w-full gradient-btn py-2 text-xs font-semibold"
            >
              Parse & Fill Expense
            </button>
          </div>
        )}

        {/* Receipt OCR Mode */}
        {entryMode === 'receipt_ocr' && (
          <div className="mb-4 p-4 rounded-2xl border bg-violet-500/10 border-violet-500/20 text-center">
            <div className="w-10 h-10 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center mx-auto mb-2">
              <Receipt className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-violet-300">Instant Itemized Bill Scanner</h4>
            <p className="text-[11px] text-gray-400 max-w-xs mx-auto mt-1 mb-3">
              Upload or scan a restaurant receipt to parse itemized dishes, tax, tip, and assign who ate what.
            </p>
            <button
              type="button"
              onClick={handleRunReceiptOcr}
              className="gradient-btn px-4 py-2 text-xs font-semibold"
            >
              Scan Sample Restaurant Bill
            </button>
          </div>
        )}

        {/* Validation Alert */}
        {validationError && (
          <div className="mb-3 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-400 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Main Form Fields */}
        <div className="space-y-3.5">
          
          {/* Group / Context Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                With you and:
              </label>
              {groups.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsCreatingQuickGroup(!isCreatingQuickGroup)}
                  className="text-[10px] text-indigo-400 font-semibold hover:underline"
                >
                  {isCreatingQuickGroup ? 'Select existing group' : '+ New Group'}
                </button>
              )}
            </div>

            {isCreatingQuickGroup || groups.length === 0 ? (
              <div className="p-2.5 rounded-xl border space-y-2" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}>
                <input
                  type="text"
                  placeholder="Group or Trip Name (e.g. Goa Trip, Roommates)"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full text-xs font-medium p-2 rounded-lg border outline-none"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                />
              </div>
            ) : (
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full text-xs font-medium p-2.5 rounded-xl border outline-none"
                style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.currency}) · {g.members.length} members
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Description & Auto-Detected Category */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
              Description
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="e.g. Dinner, Uber to airport, Groceries..."
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full text-xs font-medium pl-3 pr-8 py-2.5 rounded-xl border outline-none"
                  style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                />
              </div>

              {/* Category Picker Dropdown with Emoji */}
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="text-xs font-semibold px-2.5 py-2.5 rounded-xl border outline-none cursor-pointer"
                  style={{ 
                    background: selectedCategoryMeta.bgColor, 
                    borderColor: 'var(--border-subtle)', 
                    color: selectedCategoryMeta.color 
                  }}
                  title="Category"
                >
                  {Object.values(CATEGORIES).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name.split(' ')[0]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Large Touch-Friendly Amount Field (Splitwise Signature) */}
          <div className="p-3.5 rounded-2xl border text-center" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Total Amount ({currency})
            </span>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-2xl font-display font-extrabold text-indigo-400">
                {currency === 'INR' ? '₹' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$'}
              </span>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  setValidationError(null);
                }}
                className="text-3xl font-display font-extrabold w-48 text-center bg-transparent border-none outline-none"
                style={{ color: 'var(--text-primary)' }}
                autoFocus
              />
            </div>
          </div>

          {/* Splitwise Humanized Summary Pill */}
          {totalMinor > 0 && summaryText && (
            <div 
              className={`p-2.5 rounded-xl text-xs font-semibold text-center border animate-fade-in ${
                summaryType === 'lent' 
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                  : summaryType === 'borrowed' 
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' 
                  : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
              }`}
            >
              {summaryText}
            </div>
          )}

          {/* Paid by & Split Configuration Selectors */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                Paid by
              </label>
              <select
                value={payerId}
                onChange={(e) => setPayerId(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border outline-none"
                style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.id === currentUserId ? 'You' : u.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                Split type
              </label>
              <select
                value={splitType}
                onChange={(e) => setSplitType(e.target.value as SplitType)}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border outline-none"
                style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
              >
                <option value="equal">= Split Equally</option>
                <option value="exact">≠ Exact Amounts</option>
                <option value="percentage">% By Percentage</option>
                <option value="shares">|| By Shares</option>
                <option value="itemized">🧾 By Items</option>
              </select>
            </div>
          </div>

          {/* Splitwise Participant Multi-Select & Quick Add Person */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Split Between ({selectedParticipantIds.length} people)
              </span>
              <button
                type="button"
                onClick={() => setShowAddPersonInput(!showAddPersonInput)}
                className="text-[10px] text-indigo-400 font-semibold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add person
              </button>
            </div>

            {/* Inline Person Add Input */}
            {showAddPersonInput && (
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Friend's name (e.g. Sarah)"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPerson();
                    }
                  }}
                  className="flex-1 text-xs px-3 py-1.5 rounded-xl border outline-none"
                  style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddPerson}
                  className="gradient-btn px-3 py-1 text-xs font-semibold rounded-xl"
                >
                  + Add
                </button>
              </div>
            )}

            {/* Participant Chips */}
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 rounded-xl border" style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}>
              {users.map((u) => {
                const isSelected = selectedParticipantIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        if (selectedParticipantIds.length > 1) {
                          setSelectedParticipantIds(selectedParticipantIds.filter((id) => id !== u.id));
                        }
                      } else {
                        setSelectedParticipantIds([...selectedParticipantIds, u.id]);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-gray-500/10 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <img src={u.avatar} alt={u.name} className="w-4 h-4 rounded-full object-cover" />
                    <span>{u.id === currentUserId ? 'You' : u.name.split(' ')[0]}</span>
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </button>
                );
              })}
            </div>

            {/* Custom Split breakdown inputs when not equal */}
            {splitType !== 'equal' && splitType !== 'itemized' && (
              <div className="mt-2.5 p-2.5 rounded-xl border space-y-2" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
                <span className="text-[10px] font-bold uppercase text-gray-400 block">
                  {splitType === 'exact' ? 'Enter exact amounts' : splitType === 'percentage' ? 'Enter percentages (%)' : 'Enter shares (parts)'}
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {selectedParticipantIds.map((uid) => {
                    const u = users.find((user) => user.id === uid);
                    return (
                      <div key={uid} className="flex items-center justify-between gap-2 text-xs">
                        <span className="truncate text-gray-300 font-medium">
                          {uid === currentUserId ? 'You' : u?.name || 'User'}
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step={splitType === 'shares' ? '1' : '0.01'}
                            placeholder={splitType === 'exact' ? '0.00' : splitType === 'percentage' ? '0' : '1'}
                            value={
                              splitType === 'exact'
                                ? exactAmounts[uid] || ''
                                : splitType === 'percentage'
                                ? percentages[uid] || ''
                                : shares[uid] || ''
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              if (splitType === 'exact') {
                                setExactAmounts((prev) => ({ ...prev, [uid]: val }));
                              } else if (splitType === 'percentage') {
                                setPercentages((prev) => ({ ...prev, [uid]: val }));
                              } else if (splitType === 'shares') {
                                setShares((prev) => ({ ...prev, [uid]: val }));
                              }
                            }}
                            className="w-24 text-right p-1 rounded-lg border outline-none font-mono text-xs"
                            style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                          />
                          <span className="text-[11px] text-gray-400 w-4">
                            {splitType === 'exact' ? (currency === 'INR' ? '₹' : '$') : splitType === 'percentage' ? '%' : 'pts'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Date & Notes Accordion / Inputs */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div>
              <label className="block text-[11px] font-semibold mb-1 text-gray-400">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs font-medium p-2 rounded-xl border outline-none"
                style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1 text-gray-400">
                Note / Memo (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Split equally"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs font-medium p-2 rounded-xl border outline-none"
                style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

        </div>

        {/* Modal Action Buttons */}
        <div className="mt-5 pt-3 border-t flex items-center justify-end gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl text-gray-400 hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim() || totalMinor <= 0}
            className="gradient-btn px-5 py-2.5 text-xs font-bold shadow-lg disabled:opacity-50"
          >
            Save Expense
          </button>
        </div>

      </div>
    </div>
  );
};
