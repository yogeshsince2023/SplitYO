export type Currency = 'USD' | 'EUR' | 'GBP' | 'INR' | 'CAD' | 'AUD' | 'JPY';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  upiId?: string;
}

export type GroupCategory = 'trip' | 'home' | 'couple' | 'event' | 'office' | 'other';

export interface GroupMember {
  userId: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
}

export interface Group {
  id: string;
  name: string;
  category: GroupCategory;
  currency: Currency;
  members: GroupMember[];
  coverGradient: string;
  inviteCode: string;
  createdAt: string;
}

export type SplitType = 'equal' | 'exact' | 'percentage' | 'shares' | 'itemized';

export interface ExpenseSplit {
  userId: string;
  amountMinor: number; // In cents/paise (integer)
  percentage?: number;
  shares?: number;
}

export interface ExpensePayer {
  userId: string;
  amountMinor: number;
}

export interface ReceiptItem {
  id: string;
  name: string;
  priceMinor: number;
  assignedUserIds: string[];
}

export interface Expense {
  id: string;
  groupId: string;
  title: string;
  totalMinor: number; // Total in integer minor currency units
  currency: Currency;
  category: string;
  date: string;
  notes?: string;
  payers: ExpensePayer[];
  splitType: SplitType;
  splits: ExpenseSplit[];
  receiptItems?: ReceiptItem[];
  receiptUrl?: string;
  createdAt: string;
  createdBy: string;
  isReversed?: boolean;
}

export interface Settlement {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amountMinor: number;
  currency: Currency;
  method: 'upi' | 'cash' | 'bank_transfer' | 'other';
  notes?: string;
  date: string;
  confirmed: boolean;
}

export interface SimplifiedDebt {
  fromUserId: string;
  toUserId: string;
  amountMinor: number;
  currency: Currency;
}

export interface RecurringBill {
  id: string;
  groupId: string;
  title: string;
  amountMinor: number;
  currency: Currency;
  category: string;
  payerUserId: string;
  interval: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  nextDueDate: string;
  splits: ExpenseSplit[];
  active: boolean;
}

export interface ActivityEvent {
  id: string;
  groupId: string;
  type: 'expense_created' | 'expense_edited' | 'expense_reversed' | 'settlement_recorded' | 'member_joined';
  actorId: string;
  summary: string;
  timestamp: string;
}

export interface SyncStatus {
  isOnline: boolean;
  pendingCount: number;
  lastSyncedAt?: string;
}
