# Discount Feature Tests

This directory contains comprehensive unit and integration tests for the discount feature.

## Test Files

### 1. `DiscountModal.test.tsx`
Tests for the DiscountModal component including:
- Modal rendering and visibility
- Discount type switching (percentage/fixed)
- Validation rules (max limits, reason requirements)
- Price calculations
- User interactions (apply, cancel, close)
- Form state management

### 2. `discount.test.ts`
Unit tests for discount calculation functions:
- Percentage discount calculations
- Fixed amount discount calculations
- Edge cases (zero, negative, very large values)
- Discount validation logic
- Cart subtotal calculations with discounts

### 3. `discount-integration.test.ts`
Integration tests for the complete discount flow:
- Settings integration
- Discount application to cart items
- Sale transaction preparation
- Discount display in sales view
- Permission checks

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run tests with UI
```bash
npm run test:ui
```

### Generate coverage report
```bash
npm run test:coverage
```

## Test Coverage

The tests cover:
- ✅ Component rendering and interactions
- ✅ Discount calculations (percentage and fixed)
- ✅ Validation rules and error messages
- ✅ Settings integration
- ✅ Cart operations with discounts
- ✅ Sale transaction data preparation
- ✅ Permission checks
- ✅ Edge cases and error handling

## Test Results Expected

All tests should pass with the following coverage:
- **Statements**: > 90%
- **Branches**: > 85%
- **Functions**: > 90%
- **Lines**: > 90%

## Key Test Scenarios

### Validation Tests
- Discount exceeding max percentage (should fail)
- Discount exceeding max amount (should fail)
- Discount >= item price (should fail)
- Missing reason when required (should fail)
- Zero discount value (should fail)

### Calculation Tests
- 10% of $100 = $90 final price
- 50% of $100 = $50 final price
- $25 off $100 = $75 final price
- Discount + quantity = correct subtotal

### Integration Tests
- Settings enable/disable discounts
- Apply discount to cart item
- Prepare sale with discount data
- Display discounts in sales view

## Adding New Tests

When adding new discount-related features:
1. Add unit tests for any new calculations
2. Add component tests for UI changes
3. Add integration tests for workflow changes
4. Update this README with new test scenarios

## Troubleshooting

If tests fail:
1. Check that dependencies are installed: `npm install`
2. Ensure the dev server is not running (may cause conflicts)
3. Clear test cache: `npx vitest --clearCache`
4. Check console for specific error messages

## CI/CD Integration

These tests can be integrated into CI/CD pipelines:
```yaml
- name: Run Tests
  run: npm test

- name: Generate Coverage
  run: npm run test:coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
```
