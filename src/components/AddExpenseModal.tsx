import React, { useState } from 'react';
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
import { parseNaturalLanguageExpense, simulateReceiptOCR } from '../engine/aiParser';
import { 
  X, 
  Sparkles, 
  Mic, 
  Camera, 
  Receipt, 
  Users, 
  Check, 
  AlertCircle,
  Plus,
  Trash2
} from 'lucide-react';

interface AddExpenseModalProps {
  groups: Group[];
  users: User[];
  currentUserId: string;
  defaultGroupId?: string;
  onClose: () => void;
  onSaveExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  groups,
  users,
  currentUserId,
  defaultGroupId,
  onClose,
  onSaveExpense,
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    defaultGroupId || groups[0]?.id || '',
  );

  const activeGroup = groups.find((g) => g.id === selectedGroupId) || groups[0];
  const groupMembers = users.filter((u) =>
    activeGroup?.members.some((m) => m.userId === u.id),
  );

  // Mode: 'form' | 'ai_text' | 'receipt_ocr'
  const [entryMode, setEntryMode] = useState<'form' | 'ai_text' | 'receipt_ocr'>('form');

  // Basic Details
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [currency, setCurrency] = useState<Currency>(activeGroup?.currency || 'INR');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Payers (default: current user pays 100%)
  const [payerId, setPayerId] = useState<string>(currentUserId);

  // Split Type & Allocations
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>(
    groupMembers.map((m) => m.id),
  );

  // Custom allocation states
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({});
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [shares, setShares] = useState<Record<string, string>>({});
  
  // Itemized Receipt Split
  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [taxTipMinor, setTaxTipMinor] = useState<number>(0);

  // AI Natural Language input
  const [aiInputText, setAiInputText] = useState('');
  const [aiListening, setAiListening] = useState(false);

  // Error state
  const [validationError, setValidationError] = useState<string | null>(null);

  const totalMinor = parseMoneyToMinor(amountStr || '0', currency);

  // Handle Natural Language Parse
  const handleApplyAiText = (text: string) => {
    if (!text.trim()) return;
    const draft = parseNaturalLanguageExpense(text, groupMembers, currentUserId, currency);
    setTitle(draft.title);
    setAmountStr((draft.totalMinor / 100).toFixed(2));
    setCategory(draft.category);
    if (draft.payerUserId) setPayerId(draft.payerUserId);
    setSelectedParticipantIds(draft.participantUserIds);
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
    if (splitType === 'equal') {
      return calculateEqualSplit(totalMinor, selectedParticipantIds);
    }

    if (splitType === 'exact') {
      return selectedParticipantIds.map((uid) => ({
        userId: uid,
        amountMinor: parseMoneyToMinor(exactAmounts[uid] || '0', currency),
      }));
    }

    if (splitType === 'percentage') {
      const pcts = selectedParticipantIds.map((uid) => ({
        userId: uid,
        percentage: parseFloat(percentages[uid] || '0'),
      }));
      return calculatePercentageSplit(totalMinor, pcts);
    }

    if (splitType === 'shares') {
      const shs = selectedParticipantIds.map((uid) => ({
        userId: uid,
        shares: parseInt(shares[uid] || '1', 10),
      }));
      return calculateSharesSplit(totalMinor, shs);
    }

    if (splitType === 'itemized') {
      return calculateItemizedSplit(receiptItems, taxTipMinor, selectedParticipantIds);
    }

    return [];
  };

  const handleSave = () => {
    if (!title.trim()) {
      setValidationError('Please enter an expense title.');
      return;
    }

    if (totalMinor <= 0) {
      setValidationError('Amount must be greater than zero.');
      return;
    }

    const calculatedSplits = computeCurrentSplits();
    const validation = validateSplits(totalMinor, calculatedSplits, splitType);

    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid split distribution.');
      return;
    }

    onSaveExpense({
      groupId: selectedGroupId,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-modal-pop">
      <div 
        className="glass-panel w-full max-w-lg p-5 sm:p-6 relative my-auto max-h-[90vh] overflow-y-auto shadow-2xl"
        style={{ background: 'var(--bg-surface)' }}
      >
        {/* Mobile Sheet Drag Handle */}
        <div className="w-12 h-1.5 bg-gray-400/30 rounded-full mx-auto mb-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white" style={{ background: 'var(--brand-gradient)' }}>
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                Add Shared Expense
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Split fairly with zero floating-point rounding errors
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-500/10 text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Mode Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 my-4 p-1 rounded-xl" style={{ background: 'var(--border-subtle)' }}>
          <button
            onClick={() => setEntryMode('form')}
            className={`py-2 text-xs font-semibold rounded-lg transition-all ${
              entryMode === 'form' ? 'bg-white dark:bg-gray-800 text-indigo-400 shadow-sm' : 'text-gray-400'
            }`}
          >
            Standard Form
          </button>
          <button
            onClick={() => setEntryMode('ai_text')}
            className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              entryMode === 'ai_text' ? 'bg-white dark:bg-gray-800 text-indigo-400 shadow-sm' : 'text-gray-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> AI Voice & Text
          </button>
          <button
            onClick={() => setEntryMode('receipt_ocr')}
            className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              entryMode === 'receipt_ocr' ? 'bg-white dark:bg-gray-800 text-violet-400 shadow-sm' : 'text-gray-400'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" /> Scan Receipt
          </button>
        </div>

        {/* AI Voice & Text Input Mode */}
        {entryMode === 'ai_text' && (
          <div className="mb-4 p-4 rounded-2xl border bg-indigo-500/5 border-indigo-500/20">
            <div className="flex items-center gap-2 mb-2 text-indigo-500 dark:text-indigo-400 font-semibold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>Smart Natural Language Expense Parser</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Type or speak naturally. Examples: <br />
              <span className="italic font-medium">"Dinner ₹1200 paid by Priya for everyone"</span> or <br />
              <span className="italic font-medium">"Uber $35 paid by me for Rahul and Arjun"</span>
            </p>

            <div className="relative">
              <textarea
                rows={2}
                value={aiInputText}
                onChange={(e) => setAiInputText(e.target.value)}
                placeholder="Say or type your expense..."
                className="w-full text-sm p-3 rounded-xl border outline-none pr-12"
                style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
              />
              <button
                type="button"
                onClick={() => {
                  setAiListening(true);
                  // Simulating quick voice transcription
                  setTimeout(() => {
                    setAiInputText(`Weekend team dinner ₹2,400 paid by ${groupMembers[0]?.name || 'me'} for all`);
                    setAiListening(false);
                  }, 1200);
                }}
                className={`absolute right-2.5 top-2.5 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  aiListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-indigo-500/15 text-indigo-400'
                }`}
                title="Tap to speak"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => handleApplyAiText(aiInputText)}
                className="gradient-btn px-4 py-2 text-xs font-semibold"
              >
                Parse & Populate Form
              </button>
            </div>
          </div>
        )}

        {/* Receipt Scanner OCR Mode */}
        {entryMode === 'receipt_ocr' && (
          <div className="mb-4 p-5 rounded-2xl border text-center bg-purple-500/5 border-purple-500/20">
            <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-purple-500/15 text-purple-500 mb-2">
              <Camera className="w-6 h-6" />
            </div>
            <h4 className="font-display font-bold text-sm text-purple-600 dark:text-purple-400">
              AI Receipt Itemization Engine
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto my-2">
              Extract line items, tax, and tip automatically. Assign individual items to specific people so nobody pays for someone else's meal.
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                type="button"
                onClick={handleRunReceiptOcr}
                className="gradient-btn px-4 py-2 text-xs"
              >
                Run Receipt Scanner Demo
              </button>
            </div>
          </div>
        )}

        {/* Validation Alert */}
        {validationError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-500 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Core Form Fields */}
        <div className="space-y-4">
          
          {/* Group and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                Group
              </label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full text-xs font-medium p-2.5 rounded-xl border outline-none"
                style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.currency})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs font-medium p-2.5 rounded-xl border outline-none"
                style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
              >
                <option value="Food">🍽️ Food & Dining</option>
                <option value="Groceries">🛒 Groceries & Household</option>
                <option value="Transport">🚕 Transport & Fuel</option>
                <option value="Utilities">💡 Utilities & Bills</option>
                <option value="Entertainment">🎟️ Entertainment & Movies</option>
                <option value="Shopping">🛍️ Shopping</option>
                <option value="Home">🏠 Rent & Repairs</option>
                <option value="General">📦 General</option>
              </select>
            </div>
          </div>

          {/* Title & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                Expense Description
              </label>
              <input
                type="text"
                placeholder="e.g. Italian Restaurant Dinner"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setValidationError(null);
                }}
                className="w-full text-sm font-medium p-2.5 rounded-xl border outline-none"
                style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                Amount ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  setValidationError(null);
                }}
                className="w-full text-sm font-bold p-2.5 rounded-xl border outline-none text-indigo-400"
                style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)' }}
              />
            </div>
          </div>

          {/* Paid By */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
              Paid by
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {groupMembers.map((m) => {
                const isSelected = payerId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPayerId(m.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                        : 'border-transparent text-gray-400 hover:bg-gray-500/5'
                    }`}
                    style={{ background: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'var(--border-subtle)' }}
                  >
                    <img src={m.avatar} alt={m.name} className="w-4 h-4 rounded-full object-cover" />
                    <span>{m.id === currentUserId ? 'You' : m.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Split Type Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Split Method
              </label>
              <span className="text-[11px] text-gray-400 font-medium">
                {selectedParticipantIds.length} members involved
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-1 rounded-xl" style={{ background: 'var(--border-subtle)' }}>
              {[
                { id: 'equal', label: 'Equally' },
                { id: 'exact', label: 'Exact' },
                { id: 'percentage', label: 'By %' },
                { id: 'shares', label: 'By Shares' },
                { id: 'itemized', label: 'Itemized' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSplitType(st.id as SplitType)}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    splitType === st.id ? 'bg-white dark:bg-gray-800 text-indigo-400 shadow-sm' : 'text-gray-400'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Participant Split Details */}
          <div className="p-3.5 rounded-2xl border" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-primary)' }}>
            
            {/* Equal Split Details */}
            {splitType === 'equal' && (
              <div className="space-y-2">
                <div className="text-[11px] text-gray-400 mb-2 flex justify-between">
                  <span>Toggle participants:</span>
                  <span className="font-semibold text-indigo-400">
                    {selectedParticipantIds.length > 0
                      ? `${formatMoney(Math.floor(totalMinor / selectedParticipantIds.length), currency)} / person`
                      : 'None'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {groupMembers.map((m) => {
                    const isChecked = selectedParticipantIds.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            if (selectedParticipantIds.length > 1) {
                              setSelectedParticipantIds(selectedParticipantIds.filter((id) => id !== m.id));
                            }
                          } else {
                            setSelectedParticipantIds([...selectedParticipantIds, m.id]);
                          }
                        }}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-medium text-left transition-all ${
                          isChecked ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : 'border-transparent text-gray-400 opacity-60'
                        }`}
                        style={{ background: isChecked ? 'rgba(99, 102, 241, 0.08)' : 'var(--border-subtle)' }}
                      >
                        <div className={`w-4 h-4 rounded-md flex items-center justify-center border ${isChecked ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-400'}`}>
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                        <span className="truncate">{m.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Exact Split Details */}
            {splitType === 'exact' && (
              <div className="space-y-2.5">
                <p className="text-[11px] text-gray-400">Specify exact amount for each person:</p>
                {groupMembers.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-3 text-xs">
                    <span className="truncate font-medium">{m.name}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">{currency}</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={exactAmounts[m.id] || ''}
                        onChange={(e) =>
                          setExactAmounts({ ...exactAmounts, [m.id]: e.target.value })
                        }
                        className="w-24 text-right px-2 py-1 rounded-lg border outline-none font-semibold text-indigo-400"
                        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Percentage Split Details */}
            {splitType === 'percentage' && (
              <div className="space-y-2.5">
                <p className="text-[11px] text-gray-400">Specify percentages (must equal 100%):</p>
                {groupMembers.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-3 text-xs">
                    <span className="truncate font-medium">{m.name}</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        placeholder="%"
                        value={percentages[m.id] || ''}
                        onChange={(e) =>
                          setPercentages({ ...percentages, [m.id]: e.target.value })
                        }
                        className="w-20 text-right px-2 py-1 rounded-lg border outline-none font-semibold text-indigo-400"
                        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                      />
                      <span className="text-gray-400">%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Shares Split Details */}
            {splitType === 'shares' && (
              <div className="space-y-2.5">
                <p className="text-[11px] text-gray-400">Specify shares / weights (e.g. 1, 2, 3 shares):</p>
                {groupMembers.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-3 text-xs">
                    <span className="truncate font-medium">{m.name}</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        placeholder="1"
                        value={shares[m.id] || '1'}
                        onChange={(e) =>
                          setShares({ ...shares, [m.id]: e.target.value })
                        }
                        className="w-20 text-right px-2 py-1 rounded-lg border outline-none font-semibold text-indigo-400"
                        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
                      />
                      <span className="text-gray-400">share(s)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Itemized Receipt Details */}
            {splitType === 'itemized' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>Receipt Items ({receiptItems.length})</span>
                  <button
                    type="button"
                    onClick={() => {
                      setReceiptItems([
                        ...receiptItems,
                        {
                          id: `item_${Date.now()}`,
                          name: 'New Item',
                          priceMinor: 20000,
                          assignedUserIds: [],
                        },
                      ]);
                    }}
                    className="text-indigo-400 hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <Plus className="w-3 h-3" /> Add Item
                  </button>
                </div>

                {receiptItems.length === 0 ? (
                  <div className="text-center py-4 text-xs text-gray-400">
                    No items loaded. Use the "Scan Receipt" tab above or click Add Item.
                  </div>
                ) : (
                  receiptItems.map((item, idx) => (
                    <div key={item.id} className="p-2.5 rounded-xl border bg-black/5 dark:bg-white/5 space-y-1.5" style={{ borderColor: 'var(--border-subtle)' }}>
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => {
                            const updated = [...receiptItems];
                            updated[idx].name = e.target.value;
                            setReceiptItems(updated);
                          }}
                          className="font-medium bg-transparent border-b border-transparent hover:border-gray-400 outline-none flex-1"
                        />
                        <span className="font-bold text-indigo-400">
                          {formatMoney(item.priceMinor, currency)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setReceiptItems(receiptItems.filter((_, i) => i !== idx));
                          }}
                          className="text-rose-500 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1 items-center">
                        <span className="text-[10px] text-gray-400 mr-1">Assigned:</span>
                        {groupMembers.map((m) => {
                          const assigned = item.assignedUserIds.includes(m.id);
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                const updated = [...receiptItems];
                                if (assigned) {
                                  updated[idx].assignedUserIds = updated[idx].assignedUserIds.filter((id) => id !== m.id);
                                } else {
                                  updated[idx].assignedUserIds = [...updated[idx].assignedUserIds, m.id];
                                }
                                setReceiptItems(updated);
                              }}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all ${
                                assigned ? 'bg-indigo-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                              }`}
                            >
                              {m.name.split(' ')[0]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>

          {/* Date and Optional Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs font-medium p-2.5 rounded-xl border outline-none"
                style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                Notes (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Flight booking reference"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs font-medium p-2.5 rounded-xl border outline-none"
                style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t flex items-center justify-end gap-3" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl border text-gray-400 hover:text-gray-200"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="gradient-btn px-5 py-2 text-xs font-semibold shadow-md flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" /> Save Expense
          </button>
        </div>

      </div>
    </div>
  );
};
