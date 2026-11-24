/**
 * Firestore Security Rules Specification Test Suite (Dirty Dozen Verification)
 * Verifies all 12 adversarial payloads defined in security_spec.md return PERMISSION_DENIED.
 */

export interface AdversarialCase {
  id: number;
  name: string;
  auth: { uid: string; email_verified: boolean } | null;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_CASES: AdversarialCase[] = [
  {
    id: 1,
    name: 'Identity Spoofing on Profile Create',
    auth: { uid: 'user_a', email_verified: true },
    operation: 'create',
    path: '/users/user_a',
    payload: { userId: 'user_b', name: 'Spoof' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified Email Write',
    auth: { uid: 'user_a', email_verified: false },
    operation: 'create',
    path: '/users/user_a',
    payload: { userId: 'user_a', name: 'Unverified' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Cross-User PII Read',
    auth: { uid: 'user_b', email_verified: true },
    operation: 'get',
    path: '/users/user_a/private/info',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Orphaned Subcollection Write Without Parent User',
    auth: { uid: 'user_ghost', email_verified: true },
    operation: 'create',
    path: '/users/user_ghost/workouts/w1',
    payload: { userId: 'user_ghost', category: 'gym', title: 'Squats' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Shadow Field Injection on Create',
    auth: { uid: 'user_a', email_verified: true },
    operation: 'create',
    path: '/users/user_a/meals/m1',
    payload: { userId: 'user_a', isAdmin: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Shadow Field Injection on Update',
    auth: { uid: 'user_a', email_verified: true },
    operation: 'update',
    path: '/users/user_a/dailyLogs/2026-11-01',
    payload: { steps: 8000, bonusPoints: 999 },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Value Poisoning on Update',
    auth: { uid: 'user_a', email_verified: true },
    operation: 'update',
    path: '/users/user_a/dailyLogs/2026-11-01',
    payload: { steps: -500 },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'ID Poisoning Guard',
    auth: { uid: 'user_a', email_verified: true },
    operation: 'create',
    path: '/users/user_a/workouts/invalid$id!poison',
    payload: { userId: 'user_a' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Client Timestamp Forgery',
    auth: { uid: 'user_a', email_verified: true },
    operation: 'create',
    path: '/users/user_a/measurements/m1',
    payload: { userId: 'user_a', createdAt: '1999-01-01T00:00:00Z' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Immortal Field Mutation on Update',
    auth: { uid: 'user_a', email_verified: true },
    operation: 'update',
    path: '/users/user_a/workouts/w1',
    payload: { userId: 'user_b' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Unbounded Array Overflow on Equipment',
    auth: { uid: 'user_a', email_verified: true },
    operation: 'create',
    path: '/users/user_a',
    payload: { userId: 'user_a', equipment: new Array(25).fill('dumbbells') },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Cross-User List Scraping',
    auth: { uid: 'user_b', email_verified: true },
    operation: 'list',
    path: '/users/user_a/workouts',
    expectedResult: 'PERMISSION_DENIED',
  },
];
