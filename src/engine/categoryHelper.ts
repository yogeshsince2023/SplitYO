export interface CategoryMeta {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
}

export const CATEGORIES: Record<string, CategoryMeta> = {
  Food: {
    id: 'Food',
    name: 'Food & Dining',
    icon: '🍽️',
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.12)',
  },
  Transport: {
    id: 'Transport',
    name: 'Transport & Fuel',
    icon: '🚕',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.12)',
  },
  Groceries: {
    id: 'Groceries',
    name: 'Groceries & Mart',
    icon: '🛒',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.12)',
  },
  Utilities: {
    id: 'Utilities',
    name: 'Bills & Utilities',
    icon: '💡',
    color: '#eab308',
    bgColor: 'rgba(234, 179, 8, 0.12)',
  },
  Entertainment: {
    id: 'Entertainment',
    name: 'Movies & Events',
    icon: '🎟️',
    color: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.12)',
  },
  Shopping: {
    id: 'Shopping',
    name: 'Shopping & Gear',
    icon: '🛍️',
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.12)',
  },
  Home: {
    id: 'Home',
    name: 'Rent & Stay',
    icon: '🏠',
    color: '#6366f1',
    bgColor: 'rgba(99, 102, 241, 0.12)',
  },
  General: {
    id: 'General',
    name: 'General',
    icon: '📦',
    color: '#64748b',
    bgColor: 'rgba(100, 116, 139, 0.12)',
  },
};

/** Splitwise-style auto-category detection from expense title */
export function detectCategoryFromTitle(title: string): string {
  const lower = title.toLowerCase();
  
  if (/dinner|lunch|breakfast|food|pizza|burger|coffee|tea|chai|cafe|beer|wine|drinks|bar|restaurant|snack|bakery|dessert|swiggy|zomato|kfc|mcdonald|domino/i.test(lower)) {
    return 'Food';
  }
  if (/uber|ola|cab|taxi|metro|train|flight|air|bus|auto|petrol|fuel|diesel|toll|parking|rapido|fastag/i.test(lower)) {
    return 'Transport';
  }
  if (/groceries|grocery|supermarket|vegetable|fruit|milk|bread|egg|mart|dmart|blinkit|zepto|instamart|costco|bigbasket|nature/i.test(lower)) {
    return 'Groceries';
  }
  if (/rent|maintenance|wifi|internet|electricity|power|water|gas|cylinder|maid|cook|cleaning|society/i.test(lower)) {
    return 'Utilities';
  }
  if (/movie|cinema|netflix|prime|disney|hotstar|spotify|concert|show|tickets|game|bowling|arcade|playstation|event/i.test(lower)) {
    return 'Entertainment';
  }
  if (/shopping|amazon|flipkart|clothes|shoes|myntra|zara|h&m|electronics|gift|apple|gadget/i.test(lower)) {
    return 'Shopping';
  }
  if (/hotel|airbnb|resort|hostel|stay|lodge|villa|room/i.test(lower)) {
    return 'Home';
  }
  
  return 'General';
}

/** Formats a date string (YYYY-MM-DD or ISO) into Splitwise-style Month and Day */
export function formatSplitwiseDate(dateStr: string): { month: string; day: string } {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { month: 'OCT', day: '28' };
    const month = d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const day = d.getDate().toString().padStart(2, '0');
    return { month, day };
  } catch {
    return { month: 'OCT', day: '28' };
  }
}
