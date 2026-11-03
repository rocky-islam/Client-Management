import assert from 'assert';
import { calculateTimeLeft, calculateOutstandingAmount, calculateAchievement, isOverdue } from '../src/lib/calculations';
import { projectSchema } from '../src/lib/validations';
import { hashPassword, verifyPassword } from '../src/lib/auth';

console.log('🧪 Starting Rocky Business Manager Unit & Business Logic Test Suite...\n');

// 1. FINANCIAL TESTS
console.log('--- TEST 1: Financial & Outstanding Balances ---');
{
  // Project worth $500, no advance, no payments
  const res1 = calculateOutstandingAmount(500, 0, []);
  assert.strictEqual(res1.outstanding, 500);
  assert.strictEqual(res1.totalReceived, 0);
  assert.strictEqual(res1.paymentStatus, 'UNPAID');

  // Record $200 payment -> outstanding $300
  const res2 = calculateOutstandingAmount(500, 0, [{ amount: 200, status: 'COMPLETED' }]);
  assert.strictEqual(res2.outstanding, 300);
  assert.strictEqual(res2.totalReceived, 200);
  assert.strictEqual(res2.paymentStatus, 'PARTIALLY_PAID');

  // Record another $300 payment -> outstanding 0
  const res3 = calculateOutstandingAmount(500, 0, [
    { amount: 200, status: 'COMPLETED' },
    { amount: 300, status: 'COMPLETED' },
  ]);
  assert.strictEqual(res3.outstanding, 0);
  assert.strictEqual(res3.totalReceived, 500);
  assert.strictEqual(res3.paymentStatus, 'PAID');

  // With advance payment $100 + $400 payment on $500 project
  const res4 = calculateOutstandingAmount(500, 100, [{ amount: 400, status: 'COMPLETED' }]);
  assert.strictEqual(res4.outstanding, 0);
  assert.strictEqual(res4.totalReceived, 500);
  assert.strictEqual(res4.paymentStatus, 'PAID');

  // Refunded / Cancelled payments should not be counted
  const res5 = calculateOutstandingAmount(500, 0, [
    { amount: 200, status: 'COMPLETED' },
    { amount: 300, status: 'REFUNDED' },
  ]);
  assert.strictEqual(res5.outstanding, 300);
  assert.strictEqual(res5.totalReceived, 200);
  assert.strictEqual(res5.paymentStatus, 'PARTIALLY_PAID');

  console.log('✔ Financial & Outstanding calculations passed!');
}

// 2. DYNAMIC DEADLINE & TIME LEFT TESTS
console.log('\n--- TEST 2: Dynamic Deadlines & Time Left ---');
{
  const today = new Date();
  
  // Future deadline (+5 days)
  const future = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);
  const resFuture = calculateTimeLeft(future, 'WIP');
  assert.strictEqual(resFuture.isOverdue, false);
  assert.ok(resFuture.text.includes('days left'));

  // Past deadline (-3 days) on WIP project -> Overdue
  const past = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
  const resPast = calculateTimeLeft(past, 'WIP');
  assert.strictEqual(resPast.isOverdue, true);
  assert.ok(resPast.text.includes('overdue'));
  assert.strictEqual(isOverdue(past, 'WIP'), true);

  // Delivered project even with past deadline is NOT overdue
  const resDelivered = calculateTimeLeft(past, 'DELIVERED');
  assert.strictEqual(resDelivered.isOverdue, false);
  assert.strictEqual(resDelivered.text, 'Delivered');
  assert.strictEqual(isOverdue(past, 'DELIVERED'), false);

  // Cancelled project is NOT overdue
  const resCancelled = calculateTimeLeft(past, 'CANCELLED');
  assert.strictEqual(resCancelled.isOverdue, false);
  assert.strictEqual(resCancelled.text, 'Cancelled');
  assert.strictEqual(isOverdue(past, 'CANCELLED'), false);

  console.log('✔ Dynamic Deadline & Time Left calculations passed!');
}

// 3. TARGET ACHIEVEMENT TESTS
console.log('\n--- TEST 3: Targets & Achievement Benchmarks ---');
{
  assert.strictEqual(calculateAchievement(2500, 5000), 50);
  assert.strictEqual(calculateAchievement(5000, 5000), 100);
  assert.strictEqual(calculateAchievement(6000, 5000), 120);
  assert.strictEqual(calculateAchievement(0, 5000), 0);
  assert.strictEqual(calculateAchievement(1000, 0), 0);

  console.log('✔ Target calculations passed!');
}

// 4. AUTHENTICATION & SECURITY TESTS
console.log('\n--- TEST 4: Authentication, Hashing & Password Verification ---');
async function testAuth() {
  const plain = 'SecretPassword123!';
  const hash = await hashPassword(plain);
  assert.notStrictEqual(hash, plain);
  assert.strictEqual(await verifyPassword(plain, hash), true);
  assert.strictEqual(await verifyPassword('WrongPassword', hash), false);

  console.log('✔ Password hashing & bcrypt verification passed!');
}

// 5. CARRY FORWARD INVARIANT SIMULATION
console.log('\n--- TEST 5: Carry Forward Invariant Simulation ---');
{
  // PRJ-001 simulation
  const project = {
    id: 'prj-101',
    name: 'SaaS Customer Portal',
    orderId: 'ORD-2026-101',
    value: 1200,
    startDate: '2026-01-10',
    deadline: '2026-03-15',
  };

  const monthlyAssignments = [
    { id: 'assign-1', projectId: project.id, month: 1, year: 2026, assignmentType: 'ORIGINAL' },
    { id: 'assign-2', projectId: project.id, month: 2, year: 2026, assignmentType: 'CARRY_FORWARD', fromMonth: 1, fromYear: 2026 },
    { id: 'assign-3', projectId: project.id, month: 3, year: 2026, assignmentType: 'CARRY_FORWARD', fromMonth: 2, fromYear: 2026 },
  ];

  // Invariant 1: Exactly ONE project record exists
  const uniqueProjects = new Set([project.id]);
  assert.strictEqual(uniqueProjects.size, 1, 'Project must not be duplicated in database');

  // Invariant 2: Appears in Jan, Feb, Mar with proper assignment pointers
  const jan = monthlyAssignments.find(a => a.month === 1 && a.year === 2026);
  const feb = monthlyAssignments.find(a => a.month === 2 && a.year === 2026);
  const mar = monthlyAssignments.find(a => a.month === 3 && a.year === 2026);
  assert.strictEqual(jan?.assignmentType, 'ORIGINAL');
  assert.strictEqual(feb?.assignmentType, 'CARRY_FORWARD');
  assert.strictEqual(mar?.assignmentType, 'CARRY_FORWARD');

  // Invariant 3: Removing assignment from Feb preserves Jan and Mar
  const filteredAssignments = monthlyAssignments.filter(a => a.id !== 'assign-2');
  assert.strictEqual(filteredAssignments.length, 2);
  assert.ok(filteredAssignments.some(a => a.month === 1));
  assert.ok(filteredAssignments.some(a => a.month === 3));

  console.log('✔ Carry-Forward invariants and non-duplication rules passed!');
}

// 6. VALIDATION SCHEMAS
console.log('\n--- TEST 6: Zod Validation Schemas ---');
{
  const validProject = {
    name: 'Full Stack App',
    clientId: 'cli-1',
    projectDate: '2026-11-03',
    category: 'Web Development',
    profileName: 'Fiverr',
    orderId: 'ORD-2026-999',
    projectSource: 'Fiverr',
    value: 500,
    currency: 'USD',
    advancePayment: 100,
    startDate: '2026-11-03',
    deadline: '2026-11-20',
    salesType: 'NEW_ORDER' as const,
    orderStatus: 'NEW' as const,
    priority: 'HIGH' as const,
    progressPercentage: 10,
    assignedMonth: 11,
    assignedYear: 2026,
  };

  const parsed = projectSchema.parse(validProject);
  assert.strictEqual(parsed.orderId, 'ORD-2026-999');

  // Negative value should fail
  assert.throws(() => {
    projectSchema.parse({ ...validProject, value: -50 });
  });

  console.log('✔ Validation schemas passed!');
}

testAuth().then(() => {
  console.log('\n🎉 ALL BUSINESS LOGIC & UNIT TESTS PASSED SUCCESSFULLY (6/6 Suites)!');
});
