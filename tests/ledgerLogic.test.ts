import test from 'node:test';
import assert from 'node:assert/strict';
import { applyApprovedTransfer, applySaleToCourierStock } from '../src/services/ledgerLogic';

test('approved requests move quantities from central stock to courier stock', () => {
  const result = applyApprovedTransfer({
    central: { latte: 20, mocha: 8 },
    courier: { latte: 2 },
    items: [
      { inventoryId: 'latte', quantity: 5 },
      { inventoryId: 'mocha', quantity: 3 },
    ],
  });

  assert.deepEqual(result.central, { latte: 15, mocha: 5 });
  assert.deepEqual(result.courier, { latte: 7, mocha: 3 });
});

test('approved requests fail when central stock is insufficient', () => {
  assert.throws(
    () =>
      applyApprovedTransfer({
        central: { latte: 4 },
        courier: {},
        items: [{ inventoryId: 'latte', quantity: 5 }],
      }),
    /Insufficient central stock/,
  );
});

test('courier sales deduct courier-held stock only', () => {
  const result = applySaleToCourierStock({
    courier: { latte: 7, mocha: 3 },
    items: [
      { inventoryId: 'latte', quantity: 2 },
      { inventoryId: 'mocha', quantity: 1 },
    ],
  });

  assert.deepEqual(result.courier, { latte: 5, mocha: 2 });
});
