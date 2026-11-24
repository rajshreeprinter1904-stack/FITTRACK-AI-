# FITTRACK AI — Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Zero-Trust Catch-All**: All paths not explicitly matched deny read and write (`allow read, write: if false;`).
2. **Strict Ownership & Verified Identity**: Every user document `/users/{userId}` and all subcollections (`private`, `dailyLogs`, `workouts`, `meals`, `measurements`, `reminders`) can ONLY be read or mutated by the authenticated user whose `request.auth.uid == userId`. All write mutations mandate `request.auth.token.email_verified == true`.
3. **Master Gate Relational Sync**: Every single-document operation (`get`, `create`, `update`, `delete`) on any subcollection of `/users/{userId}` verifies `exists(/databases/$(database)/documents/users/$(userId))` so sub-resources cannot exist as orphans without a parent `UserProfile`.
4. **PII Isolation**: Email addresses are stored exclusively in `/users/{userId}/private/{docId}` (`docId == 'info'`) and never in `/users/{userId}` or tracking subcollections.
5. **Secure List Queries (Query Enforcer)**: Every `allow list` rule enforces `request.auth.uid == userId && resource.data.userId == request.auth.uid` without `get()`/`exists()` calls inside `list` to prevent O(N) read amplification and unauthorized query scraping.
6. **Temporal & Immortal Integrity**: `createdAt` and `updatedAt` must equal `request.time` on `create`; `updatedAt == request.time`, `incoming().createdAt == existing().createdAt`, and `incoming().userId == existing().userId` on `update`.
7. **Volumetric & Key Hardening**: Every string enforces `.size()` limits, every ID enforces `^[a-zA-Z0-9_\-]+$` (`<= 128` chars), arrays enforce bounded size (`<= 12`), `create` enforces `hasAll` + `hasOnly`, and `update` wraps logic in `isValid[Entity](incoming())` + named action branches with `affectedKeys().hasOnly(...)`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Payload 1 (Identity Spoofing on Profile Create)**: Authenticated `uid: "user_a"` writes `/users/user_a` with `{ "userId": "user_b", ... }` -> `PERMISSION_DENIED`.
2. **Payload 2 (Unverified Email Write)**: Authenticated `uid: "user_a"` with `email_verified: false` attempts to create `/users/user_a` -> `PERMISSION_DENIED`.
3. **Payload 3 (Cross-User PII Read)**: Authenticated `uid: "user_b"` attempts `get` on `/users/user_a/private/info` -> `PERMISSION_DENIED`.
4. **Payload 4 (Orphaned Subcollection Write)**: Authenticated `uid: "user_ghost"` (no `/users/user_ghost` doc) attempts `create` on `/users/user_ghost/workouts/w1` -> `PERMISSION_DENIED` (blocked by Master Gate `exists()`).
5. **Payload 5 (Shadow Field Injection on Create)**: Create `/users/user_a/meals/m1` with extra key `{ ..., "isAdmin": true }` -> `PERMISSION_DENIED` (`hasOnly` check fails).
6. **Payload 6 (Shadow Field Injection on Update)**: Update `/users/user_a/dailyLogs/2026-11-01` adding `"bonusPoints": 999` -> `PERMISSION_DENIED` (`affectedKeys().hasOnly(...)` fails).
7. **Payload 7 (Value Poisoning on Update)**: Update whitelisted key `steps` in `/users/user_a/dailyLogs/2026-11-01` with string `"ten thousand"` or `-500` -> `PERMISSION_DENIED` (`isValidDailyLog(incoming())` rejects).
8. **Payload 8 (ID Poisoning / Resource Exhaustion)**: Create `/users/user_a/workouts/bad$id!with/slashes_or_200_chars...` -> `PERMISSION_DENIED` (`isValidId` rejects).
9. **Payload 9 (Timestamp Forgery)**: Create `/users/user_a/measurements/m1` with past/future client `createdAt` != `request.time` -> `PERMISSION_DENIED`.
10. **Payload 10 (Immortal Field Mutation)**: Update `/users/user_a/workouts/w1` changing `createdAt` or `userId` -> `PERMISSION_DENIED`.
11. **Payload 11 (Unbounded Array Overflow)**: Create `/users/user_a` with `equipment` array containing 25 items -> `PERMISSION_DENIED` (`equipment.size() <= 12`).
12. **Payload 12 (Cross-User List Scraping)**: Authenticated `uid: "user_b"` executes `list` query on `/users/user_a/workouts` -> `PERMISSION_DENIED`.
