import { Currency, ReceiptItem, User } from '../types';
import { parseMoneyToMinor } from './expenseEngine';

export interface ParsedExpenseDraft {
  title: string;
  totalMinor: number;
  currency: Currency;
  category: string;
  payerUserId?: string;
  participantUserIds: string[];
  notes?: string;
  confidence: number;
  explanation: string;
}

export interface ParsedReceipt {
  merchant: string;
  date: string;
  currency: Currency;
  items: ReceiptItem[];
  subtotalMinor: number;
  taxMinor: number;
  tipMinor: number;
  totalMinor: number;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Food: ['dinner', 'lunch', 'breakfast', 'pizza', 'burger', 'restaurant', 'cafe', 'coffee', 'meal', 'drinks', 'bar', 'food', 'snacks'],
  Groceries: ['groceries', 'supermarket', 'walmart', 'trader joe', 'costco', 'market', 'vegetables', 'fruits', 'milk'],
  Transport: ['uber', 'lyft', 'taxi', 'flight', 'airline', 'train', 'metro', 'gas', 'petrol', 'parking', 'toll'],
  Utilities: ['electricity', 'water', 'internet', 'wifi', 'gas bill', 'power', 'broadband'],
  Entertainment: ['movie', 'cinema', 'concert', 'netflix', 'spotify', 'games', 'bowling', 'party'],
  Shopping: ['amazon', 'clothes', 'shoes', 'mall', 'store', 'electronics'],
  Home: ['rent', 'maintenance', 'furniture', 'cleaning', 'repairs'],
};

/** Parse natural language text or voice transcript into structured expense draft */
export function parseNaturalLanguageExpense(
  text: string,
  groupMembers: User[],
  currentUserId: string,
  defaultCurrency: Currency = 'INR',
): ParsedExpenseDraft {
  const lower = text.toLowerCase();

  // 1. Detect Currency
  let currency: Currency = defaultCurrency;
  if (text.includes('$') || lower.includes('usd') || lower.includes('dollars') || lower.includes('bucks')) currency = 'USD';
  else if (text.includes('€') || lower.includes('eur') || lower.includes('euros')) currency = 'EUR';
  else if (text.includes('£') || lower.includes('gbp') || lower.includes('pounds')) currency = 'GBP';
  else if (text.includes('₹') || lower.includes('rs') || lower.includes('inr') || lower.includes('rupees')) currency = 'INR';

  // 2. Detect Amount
  // matches patterns like: ₹1,200, $45.50, 45 dollars, 1200
  const amountRegex = /(?:[$€£₹]|rs\.?|inr\s*)?\s*([\d,]+(?:\.\d{1,2})?)\s*(?:dollars|bucks|rupees|rs|euros|pounds)?/i;
  const amountMatch = text.match(amountRegex);
  const amountMinor = amountMatch ? parseMoneyToMinor(amountMatch[1], currency) : 0;

  // 3. Detect Category
  let category = 'General';
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) {
      category = cat;
      break;
    }
  }

  // 4. Detect Payer
  let payerUserId = currentUserId;
  for (const member of groupMembers) {
    const fullName = member.name.toLowerCase();
    const firstName = fullName.split(' ')[0];
    const namePattern = `(?:${fullName}|${firstName})`;
    const paidByPattern = new RegExp(`(?:paid by|by)\\s+${namePattern}|${namePattern}\\s+(?:paid|bought)`, 'i');
    if (paidByPattern.test(text)) {
      payerUserId = member.id;
      break;
    }
  }

  // 5. Detect Participants
  const participantIds: Set<string> = new Set();
  const includesEveryone = lower.includes('everyone') || lower.includes('all') || lower.includes('us');

  if (includesEveryone) {
    groupMembers.forEach((m) => participantIds.add(m.id));
  } else {
    // Check for specific mentioned members (by full name or first name)
    groupMembers.forEach((m) => {
      const fullName = m.name.toLowerCase();
      const firstName = fullName.split(' ')[0];
      if (lower.includes(fullName) || (firstName.length >= 3 && new RegExp(`\\b${firstName}\\b`, 'i').test(text))) {
        participantIds.add(m.id);
      }
    });
    // Check for "me" or "I"
    if (lower.includes('me') || lower.includes('myself') || lower.includes('with me')) {
      participantIds.add(currentUserId);
    }
  }

  // Fallback to everyone if no specific participants identified
  if (participantIds.size === 0) {
    groupMembers.forEach((m) => participantIds.add(m.id));
  }

  // 6. Clean Title
  let title = text
    .replace(/(?:i paid|paid by|for everyone|for all|split|with me|\bfor\b|\bby\b)/gi, '')
    .replace(/[$€£₹]|(?:rs|inr|usd|eur)/gi, '')
    .replace(/\b\d+(?:\.\d{1,2})?\b/g, '')
    .trim();

  // If title was stripped too clean, use category or default
  if (!title || title.length < 3) {
    title = `${category} expense`;
  } else {
    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  return {
    title,
    totalMinor: amountMinor,
    currency,
    category,
    payerUserId,
    participantUserIds: Array.from(participantIds),
    confidence: amountMinor > 0 ? 0.92 : 0.6,
    explanation: `Extracted ${category} expense of ${amountMatch ? amountMatch[1] : 0} ${currency} with ${participantIds.size} participants.`,
  };
}

/** Simulate OCR receipt extraction with realistic line items and tax calculation */
export function simulateReceiptOCR(
  _imageFileOrUrl: string,
  currency: Currency = 'INR',
): ParsedReceipt {
  // Preset realistic merchant scenarios
  const scenarios = [
    {
      merchant: 'Bistro & Grill',
      items: [
        { name: 'Woodfired Truffle Pizza', priceMinor: 58000 },
        { name: 'Artisan Garlic Bread', priceMinor: 22000 },
        { name: 'Caesar Salad with Parmesan', priceMinor: 34000 },
        { name: 'Cold Pressed Lemonade (x2)', priceMinor: 26000 },
        { name: 'Dark Chocolate Fondant', priceMinor: 32000 },
      ],
      taxPercent: 5,
      tipPercent: 10,
    },
    {
      merchant: 'Organic Supermarket',
      items: [
        { name: 'Avocado Bag (4-pack)', priceMinor: 28000 },
        { name: 'Almond Milk Unsweetened', priceMinor: 19000 },
        { name: 'Sourdough Country Loaf', priceMinor: 15000 },
        { name: 'Fresh Berries Medley', priceMinor: 35000 },
        { name: 'Extra Virgin Olive Oil', priceMinor: 75000 },
      ],
      taxPercent: 8,
      tipPercent: 0,
    },
    {
      merchant: 'Highway Cafe & Lounge',
      items: [
        { name: 'Espresso Double Shot', priceMinor: 18000 },
        { name: 'Caramel Macchiato', priceMinor: 24000 },
        { name: 'Blueberry Cheesecake', priceMinor: 29000 },
        { name: 'Club Sandwich Supreme', priceMinor: 42000 },
      ],
      taxPercent: 5,
      tipPercent: 10,
    },
  ];

  // Pick a scenario deterministically
  const picked = scenarios[Math.floor(Math.random() * scenarios.length)];
  const itemsSubtotalMinor = picked.items.reduce((acc, i) => acc + i.priceMinor, 0);
  const taxMinor = Math.round((itemsSubtotalMinor * picked.taxPercent) / 100);
  const tipMinor = Math.round((itemsSubtotalMinor * picked.tipPercent) / 100);
  const totalMinor = itemsSubtotalMinor + taxMinor + tipMinor;

  const receiptItems: ReceiptItem[] = picked.items.map((item, index) => ({
    id: `item_${Date.now()}_${index}`,
    name: item.name,
    priceMinor: item.priceMinor,
    assignedUserIds: [], // initially unassigned; user clicks to allocate
  }));

  return {
    merchant: picked.merchant,
    date: new Date().toISOString().split('T')[0],
    currency,
    items: receiptItems,
    subtotalMinor: itemsSubtotalMinor,
    taxMinor,
    tipMinor,
    totalMinor,
  };
}

/** Check if Web Speech API is supported */
export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
}

/** Create Web Speech Recognition listener */
export function createSpeechListener(
  onResult: (transcript: string) => void,
  onError: (err: string) => void,
  onEnd: () => void,
) {
  if (!isSpeechRecognitionSupported()) {
    onError('Speech recognition not supported in this browser.');
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript;
    onResult(transcript);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onerror = (event: any) => {
    onError(event.error || 'Speech recognition error');
  };

  recognition.onend = () => {
    onEnd();
  };

  return recognition;
}
