import {
  ActivityEvent,
  Expense,
  Group,
  RecurringBill,
  Settlement,
  User,
} from '../types';

const STORAGE_KEY = 'splitmate_data_v1';

export interface AppState {
  currentUserId: string;
  users: User[];
  groups: Group[];
  expenses: Expense[];
  settlements: Settlement[];
  recurringBills: RecurringBill[];
  activity: ActivityEvent[];
  pendingSyncQueue: { id: string; action: string; payload: unknown; timestamp: string }[];
}

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_arjun',
    name: 'Arjun Sharma',
    email: 'arjun@splitmate.dev',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    upiId: 'arjunsharma@oksbi',
  },
  {
    id: 'usr_priya',
    name: 'Priya Patel',
    email: 'priya@splitmate.dev',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    upiId: 'priyapatel@okaxis',
  },
  {
    id: 'usr_rahul',
    name: 'Rahul Verma',
    email: 'rahul@splitmate.dev',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    upiId: 'rahulverma@paytm',
  },
  {
    id: 'usr_ananya',
    name: 'Ananya Rao',
    email: 'ananya@splitmate.dev',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    upiId: 'ananyarao@ybl',
  },
];

export const INITIAL_GROUPS: Group[] = [
  {
    id: 'grp_goa_trip',
    name: 'Goa Coastal Vacation 🌴',
    category: 'trip',
    currency: 'INR',
    coverGradient: 'from-indigo-600 via-indigo-700 to-violet-800',
    inviteCode: 'GOA2026',
    createdAt: '2026-10-20T10:00:00.000Z',
    members: [
      { userId: 'usr_arjun', role: 'owner', joinedAt: '2026-10-20' },
      { userId: 'usr_priya', role: 'admin', joinedAt: '2026-10-20' },
      { userId: 'usr_rahul', role: 'member', joinedAt: '2026-10-21' },
      { userId: 'usr_ananya', role: 'member', joinedAt: '2026-10-21' },
    ],
  },
  {
    id: 'grp_apt_402',
    name: 'Apt 402 Green Valley 🏠',
    category: 'home',
    currency: 'INR',
    coverGradient: 'from-indigo-500 via-purple-600 to-pink-600',
    inviteCode: 'APT402',
    createdAt: '2026-09-01T10:00:00.000Z',
    members: [
      { userId: 'usr_arjun', role: 'owner', joinedAt: '2026-09-01' },
      { userId: 'usr_priya', role: 'member', joinedAt: '2026-09-01' },
      { userId: 'usr_rahul', role: 'member', joinedAt: '2026-09-01' },
    ],
  },
  {
    id: 'grp_euro_trip',
    name: 'Euro Summer Trip ✈️',
    category: 'trip',
    currency: 'EUR',
    coverGradient: 'from-amber-500 via-orange-600 to-rose-600',
    inviteCode: 'EURO26',
    createdAt: '2026-08-15T10:00:00.000Z',
    members: [
      { userId: 'usr_arjun', role: 'owner', joinedAt: '2026-08-15' },
      { userId: 'usr_ananya', role: 'member', joinedAt: '2026-08-15' },
    ],
  },
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp_1',
    groupId: 'grp_goa_trip',
    title: 'Beachside Seafood Feast & Mocktails',
    totalMinor: 480000, // ₹4,800.00
    currency: 'INR',
    category: 'Food',
    date: '2026-10-24',
    notes: 'Dinner at Thalassa Anjuna',
    payers: [{ userId: 'usr_arjun', amountMinor: 480000 }],
    splitType: 'equal',
    splits: [
      { userId: 'usr_arjun', amountMinor: 120000 },
      { userId: 'usr_priya', amountMinor: 120000 },
      { userId: 'usr_rahul', amountMinor: 120000 },
      { userId: 'usr_ananya', amountMinor: 120000 },
    ],
    createdAt: '2026-10-24T20:30:00.000Z',
    createdBy: 'usr_arjun',
  },
  {
    id: 'exp_2',
    groupId: 'grp_goa_trip',
    title: 'Self-drive Thar Rental & Fuel',
    totalMinor: 650000, // ₹6,500.00
    currency: 'INR',
    category: 'Transport',
    date: '2026-10-25',
    notes: '3 days car rental from airport',
    payers: [{ userId: 'usr_priya', amountMinor: 650000 }],
    splitType: 'equal',
    splits: [
      { userId: 'usr_arjun', amountMinor: 162500 },
      { userId: 'usr_priya', amountMinor: 162500 },
      { userId: 'usr_rahul', amountMinor: 162500 },
      { userId: 'usr_ananya', amountMinor: 162500 },
    ],
    createdAt: '2026-10-25T11:00:00.000Z',
    createdBy: 'usr_priya',
  },
  {
    id: 'exp_3',
    groupId: 'grp_goa_trip',
    title: 'Scuba Diving & Watersports Package',
    totalMinor: 900000, // ₹9,000.00
    currency: 'INR',
    category: 'Entertainment',
    date: '2026-10-25',
    notes: 'Priya & Arjun opted out of parasailing',
    payers: [{ userId: 'usr_rahul', amountMinor: 900000 }],
    splitType: 'exact',
    splits: [
      { userId: 'usr_arjun', amountMinor: 200000 },
      { userId: 'usr_priya', amountMinor: 200000 },
      { userId: 'usr_rahul', amountMinor: 250000 },
      { userId: 'usr_ananya', amountMinor: 250000 },
    ],
    createdAt: '2026-10-25T16:15:00.000Z',
    createdBy: 'usr_rahul',
  },
  {
    id: 'exp_4',
    groupId: 'grp_apt_402',
    title: 'Monthly High-Speed Fiber Internet',
    totalMinor: 149900, // ₹1,499.00
    currency: 'INR',
    category: 'Utilities',
    date: '2026-10-22',
    payers: [{ userId: 'usr_arjun', amountMinor: 149900 }],
    splitType: 'equal',
    splits: [
      { userId: 'usr_arjun', amountMinor: 49968 },
      { userId: 'usr_priya', amountMinor: 49966 },
      { userId: 'usr_rahul', amountMinor: 49966 },
    ],
    createdAt: '2026-10-22T09:00:00.000Z',
    createdBy: 'usr_arjun',
  },
];

export const INITIAL_SETTLEMENTS: Settlement[] = [
  {
    id: 'stl_1',
    groupId: 'grp_goa_trip',
    fromUserId: 'usr_ananya',
    toUserId: 'usr_arjun',
    amountMinor: 100000,
    currency: 'INR',
    method: 'upi',
    notes: 'Paid via GPay',
    date: '2026-10-25',
    confirmed: true,
  },
];

export const INITIAL_RECURRING: RecurringBill[] = [
  {
    id: 'rec_1',
    groupId: 'grp_apt_402',
    title: 'Apartment Monthly Rent',
    amountMinor: 4500000, // ₹45,000.00
    currency: 'INR',
    category: 'Home',
    payerUserId: 'usr_arjun',
    interval: 'monthly',
    nextDueDate: '2026-11-01',
    active: true,
    splits: [
      { userId: 'usr_arjun', amountMinor: 1500000 },
      { userId: 'usr_priya', amountMinor: 1500000 },
      { userId: 'usr_rahul', amountMinor: 1500000 },
    ],
  },
  {
    id: 'rec_2',
    groupId: 'grp_apt_402',
    title: 'House Cleaning & Cook',
    amountMinor: 800000, // ₹8,000.00
    currency: 'INR',
    category: 'Home',
    payerUserId: 'usr_priya',
    interval: 'monthly',
    nextDueDate: '2026-11-05',
    active: true,
    splits: [
      { userId: 'usr_arjun', amountMinor: 266668 },
      { userId: 'usr_priya', amountMinor: 266666 },
      { userId: 'usr_rahul', amountMinor: 266666 },
    ],
  },
];

export const INITIAL_ACTIVITY: ActivityEvent[] = [
  {
    id: 'act_1',
    groupId: 'grp_goa_trip',
    type: 'expense_created',
    actorId: 'usr_arjun',
    summary: 'Arjun added "Beachside Seafood Feast" (₹4,800.00)',
    timestamp: '2026-10-24T20:30:00.000Z',
  },
  {
    id: 'act_2',
    groupId: 'grp_goa_trip',
    type: 'expense_created',
    actorId: 'usr_priya',
    summary: 'Priya added "Thar Rental & Fuel" (₹6,500.00)',
    timestamp: '2026-10-25T11:00:00.000Z',
  },
  {
    id: 'act_3',
    groupId: 'grp_goa_trip',
    type: 'settlement_recorded',
    actorId: 'usr_ananya',
    summary: 'Ananya paid ₹1,000.00 to Arjun via UPI',
    timestamp: '2026-10-25T18:00:00.000Z',
  },
];

/** Generate a 100% offline, privacy-preserving SVG avatar based on user initials */
export function generateUserAvatarSvg(name: string, bgGradient = '#6366f1'): string {
  const initials = (name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${bgGradient}"/><stop offset="100%" stop-color="#8b5cf6"/></linearGradient></defs><rect width="100%" height="100%" rx="50" fill="url(#g)"/><text x="50" y="58" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="38" font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${initials}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function loadAppState(): AppState {
  const emptyState: AppState = {
    currentUserId: '',
    users: [],
    groups: [],
    expenses: [],
    settlements: [],
    recurringBills: [],
    activity: [],
    pendingSyncQueue: [],
  };

  if (typeof window === 'undefined') {
    return emptyState;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          currentUserId: parsed.currentUserId || '',
          users: Array.isArray(parsed.users) ? parsed.users : [],
          groups: Array.isArray(parsed.groups) ? parsed.groups : [],
          expenses: Array.isArray(parsed.expenses) ? parsed.expenses : [],
          settlements: Array.isArray(parsed.settlements) ? parsed.settlements : [],
          recurringBills: Array.isArray(parsed.recurringBills) ? parsed.recurringBills : [],
          activity: Array.isArray(parsed.activity) ? parsed.activity : [],
          pendingSyncQueue: Array.isArray(parsed.pendingSyncQueue) ? parsed.pendingSyncQueue : [],
        };
      }
    }
  } catch (e) {
    console.error('Failed to load local storage state:', e);
  }

  return emptyState;
}

export function saveAppState(state: AppState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to persist app state:', e);
  }
}

/** Sanitize CSV text cells to prevent CSV Formula Injection (CWE-1236) */
function sanitizeCsvCell(val: string): string {
  const clean = val.replace(/"/g, '""');
  if (/^[=+\-@\t\r]/.test(clean)) {
    return `'${clean}`;
  }
  return clean;
}

/** Export group expenses as CSV string with formula injection protection */
export function exportGroupExpensesCsv(group: Group, expenses: Expense[], users: User[]): string {
  const userMap = new Map(users.map((u) => [u.id, u.name]));
  const headers = ['ID', 'Date', 'Title', 'Category', 'Total Amount', 'Currency', 'Paid By', 'Split Type', 'Participants', 'Notes'];

  const rows = expenses
    .filter((e) => e.groupId === group.id && !e.isReversed)
    .map((e) => {
      const payersStr = e.payers.map((p) => `${userMap.get(p.userId) || p.userId}: ${(p.amountMinor / 100).toFixed(2)}`).join('; ');
      const participantsStr = e.splits.map((s) => `${userMap.get(s.userId) || s.userId}: ${(s.amountMinor / 100).toFixed(2)}`).join('; ');
      return [
        `"${sanitizeCsvCell(e.id)}"`,
        `"${sanitizeCsvCell(e.date)}"`,
        `"${sanitizeCsvCell(e.title)}"`,
        `"${sanitizeCsvCell(e.category)}"`,
        (e.totalMinor / 100).toFixed(2),
        `"${sanitizeCsvCell(e.currency)}"`,
        `"${sanitizeCsvCell(payersStr)}"`,
        `"${sanitizeCsvCell(e.splitType)}"`,
        `"${sanitizeCsvCell(participantsStr)}"`,
        `"${sanitizeCsvCell(e.notes || '')}"`,
      ].join(',');
    });

  return [headers.join(','), ...rows].join('\n');
}

/** Trigger download of text content as a file */
export function triggerFileDownload(filename: string, content: string, mimeType = 'text/csv'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
