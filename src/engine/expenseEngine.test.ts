import {
  calculateEqualSplit,
  calculatePercentageSplit,
  calculateSharesSplit,
  calculateItemizedSplit,
  calculateNetBalances,
  simplifyDebts,
  formatMoney,
  parseMoneyToMinor,
} from './expenseEngine';
import { Expense, Settlement } from '../types';

function runTests() {
  console.log('--- RUNNING EXPENSE ENGINE TESTS ---');

  // Test 1: Equal split with odd remainder
  const eq1 = calculateEqualSplit(10000, ['u1', 'u2', 'u3']);
  console.assert(eq1.length === 3, 'Equal split count');
  console.assert(eq1[0].amountMinor === 3334, 'User 1 gets remainder unit');
  console.assert(eq1[1].amountMinor === 3333, 'User 2 gets base unit');
  console.assert(eq1[2].amountMinor === 3333, 'User 3 gets base unit');
  const sum1 = eq1.reduce((a, b) => a + b.amountMinor, 0);
  console.assert(sum1 === 10000, 'Sum matches 10000 exactly');

  // Test 2: Percentage split with rounding
  const pct1 = calculatePercentageSplit(10000, [
    { userId: 'u1', percentage: 33.33 },
    { userId: 'u2', percentage: 33.33 },
    { userId: 'u3', percentage: 33.34 },
  ]);
  const sum2 = pct1.reduce((a, b) => a + b.amountMinor, 0);
  console.assert(sum2 === 10000, 'Percentage split sum matches total');

  // Test 3: Shares split
  const sh1 = calculateSharesSplit(6000, [
    { userId: 'u1', shares: 1 },
    { userId: 'u2', shares: 2 },
    { userId: 'u3', shares: 3 },
  ]);
  console.assert(sh1[0].amountMinor === 1000, 'User 1 share 1/6');
  console.assert(sh1[1].amountMinor === 2000, 'User 2 share 2/6');
  console.assert(sh1[2].amountMinor === 3000, 'User 3 share 3/6');

  // Test 4: Itemized split
  const it1 = calculateItemizedSplit(
    [
      { id: '1', name: 'Pizza', priceMinor: 2000, assignedUserIds: ['u1', 'u2'] },
      { id: '2', name: 'Burger', priceMinor: 1000, assignedUserIds: ['u3'] },
    ],
    300, // tax
    ['u1', 'u2', 'u3'],
  );
  console.assert(it1.find((u) => u.userId === 'u1')?.amountMinor === 1100, 'u1 pizza + tax');
  console.assert(it1.find((u) => u.userId === 'u2')?.amountMinor === 1100, 'u2 pizza + tax');
  console.assert(it1.find((u) => u.userId === 'u3')?.amountMinor === 1100, 'u3 burger + tax');

  // Test 5: Net balances & debt simplification
  // u1 pays $300 for u1, u2, u3 equally ($100 each)
  // u2 pays $150 for u2, u3 equally ($75 each)
  const expenses: Expense[] = [
    {
      id: 'e1',
      groupId: 'g1',
      title: 'Dinner',
      totalMinor: 30000,
      currency: 'INR',
      category: 'Food',
      date: '2026-10-26',
      payers: [{ userId: 'u1', amountMinor: 30000 }],
      splitType: 'equal',
      splits: [
        { userId: 'u1', amountMinor: 10000 },
        { userId: 'u2', amountMinor: 10000 },
        { userId: 'u3', amountMinor: 10000 },
      ],
      createdAt: '2026-10-26',
      createdBy: 'u1',
    },
    {
      id: 'e2',
      groupId: 'g1',
      title: 'Groceries',
      totalMinor: 15000,
      currency: 'INR',
      category: 'Groceries',
      date: '2026-10-26',
      payers: [{ userId: 'u2', amountMinor: 15000 }],
      splitType: 'equal',
      splits: [
        { userId: 'u2', amountMinor: 7500 },
        { userId: 'u3', amountMinor: 7500 },
      ],
      createdAt: '2026-10-26',
      createdBy: 'u2',
    },
  ];

  const settlements: Settlement[] = [];
  const balances = calculateNetBalances(expenses, settlements, 'g1');
  // u1: paid 30000, owes 10000 => net +20000
  // u2: paid 15000, owes 10000 + 7500 = 17500 => net -2500
  // u3: paid 0, owes 10000 + 7500 = 17500 => net -17500
  console.assert(balances['u1'] === 20000, `u1 balance +20000 (actual: ${balances['u1']})`);
  console.assert(balances['u2'] === -2500, `u2 balance -2500 (actual: ${balances['u2']})`);
  console.assert(balances['u3'] === -17500, `u3 balance -17500 (actual: ${balances['u3']})`);

  // Simplification should result in 2 transfers:
  // u3 -> u1: 17500
  // u2 -> u1: 2500
  const simplified = simplifyDebts(balances, 'INR');
  console.assert(simplified.length === 2, `Simplified to 2 transactions (actual: ${simplified.length})`);
  console.assert(
    simplified[0].fromUserId === 'u3' && simplified[0].toUserId === 'u1' && simplified[0].amountMinor === 17500,
    'Transfer 1 is u3 -> u1: 17500',
  );
  console.assert(
    simplified[1].fromUserId === 'u2' && simplified[1].toUserId === 'u1' && simplified[1].amountMinor === 2500,
    'Transfer 2 is u2 -> u1: 2500',
  );

  console.log('ALL TESTS PASSED! Integer financial precision & debt minimization verified.');
}

runTests();
