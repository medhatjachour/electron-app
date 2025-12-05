# Refund Period Logic Tests

## Overview
This directory contains unit tests for the refund period logic used in the Sales page.

## Test Coverage

### `refundPeriod.test.ts`
Tests the `isWithinRefundPeriod` function which determines if a transaction is eligible for refund based on:
- **Refund period setting** (number of days)
- **Transaction date** (when the sale was made)

## Running the Tests

### Option 1: Using Node.js (Simplest)
```bash
cd /home/medhat/Documents/electron-app
npx tsx src/renderer/src/pages/Sales/__tests__/refundPeriod.test.ts
```

### Option 2: Using ts-node
```bash
npm install -D ts-node
npx ts-node src/renderer/src/pages/Sales/__tests__/refundPeriod.test.ts
```

### Option 3: Manual Testing in Browser Console
1. Open the Sales page in your app
2. Open DevTools Console
3. Copy the test function and run individual tests

## Test Scenarios

### ✅ Basic Functionality (6 tests)
- Refund period = 0 (disabled)
- Transaction made today
- Transaction made 1 day ago
- Transaction at exact period limit (30 days)
- Transaction beyond period (31 days)
- Transaction far beyond period (60 days)

### ✅ Different Period Lengths (4 tests)
- 7-day period (5 days ago = valid, 8 days = invalid)
- 90-day period (80 days ago = valid)
- 1-day period (2 days ago = invalid)

### ✅ Zero Period - Refunds Disabled (3 tests)
- Recent transaction (1 hour ago)
- Very recent transaction (1 second ago)
- Proves that 0 = completely disabled

### ✅ Edge Cases (3 tests)
- Future transaction dates
- Negative refund period values
- Invalid date handling

### ✅ Real-world Scenarios (9 tests)
- **7-day return policy**: Days 1, 7, 8
- **30-day return policy**: Days 15, 30, 31
- **No-refund policy (0 days)**: Today, yesterday, last week

### ✅ Boundary Testing (2 tests)
- Exact millisecond boundaries
- Very small time differences (minutes)

## Test Results Format

```
🧪 Running Refund Period Logic Tests

📋 Basic Functionality Tests
✓ should return false when refund period is 0 (refunds disabled)
✓ should return true for transaction made today when period is 30 days
...

==================================================
📊 Test Summary
==================================================
Total: 27 tests
✓ Passed: 27
✗ Failed: 0
==================================================
```

## Function Under Test

```typescript
function isWithinRefundPeriod(transactionDate: string, refundPeriodDays: number): boolean {
  if (refundPeriodDays === 0) return false // 0 means refunds disabled
  
  const transactionTime = new Date(transactionDate).getTime()
  const now = new Date().getTime()
  const daysDifference = (now - transactionTime) / (1000 * 60 * 60 * 24)
  
  return daysDifference <= refundPeriodDays
}
```

## Key Behaviors Tested

1. **Refunds Disabled (0 days)**
   - `refundPeriodDays = 0` → Always returns `false`
   - No matter how recent the transaction

2. **Within Period**
   - Days since transaction ≤ refund period → Returns `true`
   - Includes transactions made exactly at the limit

3. **Outside Period**
   - Days since transaction > refund period → Returns `false`

4. **Edge Cases**
   - Future dates (negative days) → Returns `true`
   - Negative period values → Returns `false`
   - Invalid dates → Handled gracefully

## Integration with Settings

The refund period is stored in localStorage as `refundPeriodDays`:
- Default: `30` days
- Configured in: Settings → Tax & Receipt → Refund/Return Period
- Range: `0-365` days
- `0` = Refunds completely disabled

## UI Behavior

When `refundPeriodDays = 0`:
- ❌ Refund buttons hidden
- ℹ️ Shows "Refunds Disabled" message
- 🔒 No refund options available

When within period:
- ✅ Shows "Items" and "All" refund buttons
- 🟢 Buttons are clickable

When outside period:
- 🔒 Shows "Expired" disabled button
- ℹ️ Tooltip explains period restriction
