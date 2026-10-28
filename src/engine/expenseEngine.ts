import {
  Currency,
  Expense,
  ExpenseSplit,
  ReceiptItem,
  Settlement,
  SimplifiedDebt,
  SplitType,
} from '../types';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  CAD: 'CA$',
  AUD: 'AU$',
  JPY: '¥',
};

/** Format integer minor units (cents/paise) to display string */
export function formatMoney(amountMinor: number, currency: Currency = 'INR'): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const isNegative = amountMinor < 0;
  const abs = Math.abs(amountMinor);
  
  if (currency === 'JPY') {
    return `${isNegative ? '-' : ''}${symbol}${abs.toLocaleString()}`;
  }
  
  const major = Math.floor(abs / 100);
  const minor = abs % 100;
  const minorStr = minor.toString().padStart(2, '0');
  return `${isNegative ? '-' : ''}${symbol}${major.toLocaleString()}.${minorStr}`;
}

/** Parse money input string into integer minor units (e.g., "12.50" -> 1250) */
export function parseMoneyToMinor(value: string | number, currency: Currency = 'INR'): number {
  if (typeof value === 'number') {
    return Math.round(value * (currency === 'JPY' ? 1 : 100));
  }
  const clean = value.replace(/[^0-9.-]/g, '');
  const num = parseFloat(clean);
  if (isNaN(num)) return 0;
  return Math.round(num * (currency === 'JPY' ? 1 : 100));
}

/** Calculate equal split with deterministic remainder distribution */
export function calculateEqualSplit(totalMinor: number, userIds: string[]): ExpenseSplit[] {
  if (userIds.length === 0) return [];
  const count = userIds.length;
  const baseShare = Math.floor(totalMinor / count);
  const remainder = totalMinor - baseShare * count;

  return userIds.map((userId, index) => ({
    userId,
    amountMinor: baseShare + (index < remainder ? 1 : 0),
  }));
}

/** Calculate percentage split with deterministic rounding fix */
export function calculatePercentageSplit(
  totalMinor: number,
  percentages: { userId: string; percentage: number }[],
): ExpenseSplit[] {
  let allocatedSum = 0;
  const splits = percentages.map((p) => {
    const raw = Math.round((totalMinor * p.percentage) / 100);
    allocatedSum += raw;
    return {
      userId: p.userId,
      amountMinor: raw,
      percentage: p.percentage,
    };
  });

  // Adjust diff on the largest percentage participant
  const diff = totalMinor - allocatedSum;
  if (diff !== 0 && splits.length > 0) {
    let maxIdx = 0;
    for (let i = 1; i < splits.length; i++) {
      if ((splits[i].percentage ?? 0) > (splits[maxIdx].percentage ?? 0)) {
        maxIdx = i;
      }
    }
    splits[maxIdx].amountMinor += diff;
  }

  return splits;
}

/** Calculate share/weight-based split */
export function calculateSharesSplit(
  totalMinor: number,
  shares: { userId: string; shares: number }[],
): ExpenseSplit[] {
  const totalShares = shares.reduce((acc, s) => acc + Math.max(0, s.shares), 0);
  if (totalShares === 0) return calculateEqualSplit(totalMinor, shares.map((s) => s.userId));

  let allocatedSum = 0;
  const splits = shares.map((s) => {
    const raw = Math.floor((totalMinor * s.shares) / totalShares);
    allocatedSum += raw;
    return {
      userId: s.userId,
      amountMinor: raw,
      shares: s.shares,
    };
  });

  const remainder = totalMinor - allocatedSum;
  // Distribute 1 minor unit to users with highest shares
  const sortedIndices = shares
    .map((s, idx) => ({ idx, shares: s.shares }))
    .sort((a, b) => b.shares - a.shares);

  for (let i = 0; i < remainder; i++) {
    const targetIdx = sortedIndices[i % sortedIndices.length].idx;
    splits[targetIdx].amountMinor += 1;
  }

  return splits;
}

/** Calculate itemized split from receipt items plus proportional tax/tip/discount */
export function calculateItemizedSplit(
  items: ReceiptItem[],
  taxTipDiscountMinor: number,
  fallbackUserIds: string[],
): ExpenseSplit[] {
  const userTotals: Record<string, number> = {};
  for (const uid of fallbackUserIds) {
    userTotals[uid] = 0;
  }

  let itemsSubtotal = 0;
  items.forEach((item) => {
    itemsSubtotal += item.priceMinor;
    const participants = item.assignedUserIds.length > 0 ? item.assignedUserIds : fallbackUserIds;
    const split = calculateEqualSplit(item.priceMinor, participants);
    split.forEach((s) => {
      userTotals[s.userId] = (userTotals[s.userId] || 0) + s.amountMinor;
    });
  });

  // Distribute tax/tip/discount proportionally to each person's subtotal
  if (taxTipDiscountMinor !== 0 && itemsSubtotal > 0) {
    let extraAllocated = 0;
    const userIds = Object.keys(userTotals);
    userIds.forEach((uid) => {
      const prop = userTotals[uid] / itemsSubtotal;
      const extra = Math.round(taxTipDiscountMinor * prop);
      userTotals[uid] += extra;
      extraAllocated += extra;
    });

    const diff = taxTipDiscountMinor - extraAllocated;
    if (diff !== 0 && userIds.length > 0) {
      userTotals[userIds[0]] += diff;
    }
  }

  return Object.entries(userTotals).map(([userId, amountMinor]) => ({
    userId,
    amountMinor,
  }));
}

/** Validate any split configuration */
export function validateSplits(
  totalMinor: number,
  splits: ExpenseSplit[],
  splitType: SplitType,
): { valid: boolean; error?: string } {
  if (splits.length === 0) {
    return { valid: false, error: 'At least one participant required.' };
  }

  const sum = splits.reduce((acc, s) => acc + s.amountMinor, 0);
  if (sum !== totalMinor) {
    const diff = formatMoney(Math.abs(totalMinor - sum));
    return {
      valid: false,
      error: `Splits sum does not match expense total. Difference: ${diff}`,
    };
  }

  if (splitType === 'percentage') {
    const pctSum = splits.reduce((acc, s) => acc + (s.percentage || 0), 0);
    if (Math.abs(pctSum - 100) > 0.01) {
      return { valid: false, error: `Percentages must add up to 100% (currently ${pctSum.toFixed(1)}%).` };
    }
  }

  return { valid: true };
}

/** Calculate net balances for each user in a group or system, optionally isolated by currency */
export function calculateNetBalances(
  expenses: Expense[],
  settlements: Settlement[],
  groupId?: string,
  currency?: Currency,
): Record<string, number> {
  const balances: Record<string, number> = {};

  const filteredExpenses = expenses.filter(
    (e) => !e.isReversed && (!groupId || e.groupId === groupId) && (!currency || e.currency === currency),
  );
  const filteredSettlements = settlements.filter(
    (s) => s.confirmed && (!groupId || s.groupId === groupId) && (!currency || s.currency === currency),
  );

  // 1. Process Expenses
  filteredExpenses.forEach((exp) => {
    // Payers get positive balance (+paid)
    exp.payers.forEach((p) => {
      balances[p.userId] = (balances[p.userId] || 0) + p.amountMinor;
    });

    // Consumers get negative balance (-owed)
    exp.splits.forEach((s) => {
      balances[s.userId] = (balances[s.userId] || 0) - s.amountMinor;
    });
  });

  // 2. Process Settlements
  filteredSettlements.forEach((st) => {
    // fromUser paid toUser, so fromUser's balance goes up (+paid)
    balances[st.fromUserId] = (balances[st.fromUserId] || 0) + st.amountMinor;
    // toUser received payment, so toUser's balance goes down (-received)
    balances[st.toUserId] = (balances[st.toUserId] || 0) - st.amountMinor;
  });

  return balances;
}

/** Calculate balances grouped strictly by currency to prevent mixing different monetary units */
export function calculateBalancesByCurrency(
  expenses: Expense[],
  settlements: Settlement[],
  groupId?: string,
): Partial<Record<Currency, Record<string, number>>> {
  const currencies = new Set<Currency>();
  expenses.forEach((e) => {
    if (!e.isReversed && (!groupId || e.groupId === groupId)) {
      currencies.add(e.currency);
    }
  });
  settlements.forEach((s) => {
    if (s.confirmed && (!groupId || s.groupId === groupId)) {
      currencies.add(s.currency);
    }
  });

  const result: Partial<Record<Currency, Record<string, number>>> = {};
  currencies.forEach((curr) => {
    result[curr] = calculateNetBalances(expenses, settlements, groupId, curr);
  });

  return result;
}

/**
 * Greedy debt simplification algorithm:
 * Matches largest debtor with largest creditor to minimize number of transfers.
 */
export function simplifyDebts(
  balances: Record<string, number>,
  currency: Currency = 'INR',
): SimplifiedDebt[] {
  interface Account {
    userId: string;
    amountMinor: number;
  }

  const creditors: Account[] = [];
  const debtors: Account[] = [];

  for (const [userId, net] of Object.entries(balances)) {
    if (net > 0) {
      creditors.push({ userId, amountMinor: net });
    } else if (net < 0) {
      debtors.push({ userId, amountMinor: -net }); // store as positive debt
    }
  }

  // Sort descending by amount
  creditors.sort((a, b) => b.amountMinor - a.amountMinor);
  debtors.sort((a, b) => b.amountMinor - a.amountMinor);

  const simplified: SimplifiedDebt[] = [];
  let cIdx = 0;
  let dIdx = 0;

  while (cIdx < creditors.length && dIdx < debtors.length) {
    const creditor = creditors[cIdx];
    const debtor = debtors[dIdx];

    const settleAmount = Math.min(creditor.amountMinor, debtor.amountMinor);
    if (settleAmount > 0) {
      simplified.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amountMinor: settleAmount,
        currency,
      });
    }

    creditor.amountMinor -= settleAmount;
    debtor.amountMinor -= settleAmount;

    if (creditor.amountMinor === 0) cIdx++;
    if (debtor.amountMinor === 0) dIdx++;
  }

  return simplified;
}

/** Calculate direct pairwise debt between current user and a specific friend */
export function calculatePairwiseBalance(
  currentUserId: string,
  friendId: string,
  expenses: Expense[],
  settlements: Settlement[],
  currency: Currency = 'INR',
): number {
  let net = 0;

  for (const exp of expenses) {
    if (exp.isReversed) continue;
    if (exp.currency !== currency) continue;

    const myPaid = exp.payers.find((p) => p.userId === currentUserId)?.amountMinor || 0;
    const friendPaid = exp.payers.find((p) => p.userId === friendId)?.amountMinor || 0;
    const mySplit = exp.splits.find((s) => s.userId === currentUserId)?.amountMinor || 0;
    const friendSplit = exp.splits.find((s) => s.userId === friendId)?.amountMinor || 0;

    if (exp.totalMinor <= 0) continue;

    if (myPaid > 0 && friendSplit > 0) {
      const shareCoveredByMe = Math.round((friendSplit * myPaid) / exp.totalMinor);
      net += shareCoveredByMe;
    }
    if (friendPaid > 0 && mySplit > 0) {
      const shareCoveredByFriend = Math.round((mySplit * friendPaid) / exp.totalMinor);
      net -= shareCoveredByFriend;
    }
  }

  for (const stl of settlements) {
    if (stl.currency !== currency) continue;
    if (stl.fromUserId === currentUserId && stl.toUserId === friendId) {
      net += stl.amountMinor;
    } else if (stl.fromUserId === friendId && stl.toUserId === currentUserId) {
      net -= stl.amountMinor;
    }
  }

  return net;
}
