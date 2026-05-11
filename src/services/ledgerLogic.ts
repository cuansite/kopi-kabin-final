export interface LedgerItem {
  inventoryId: string;
  quantity: number;
}

type StockMap = Record<string, number>;

function assertValidItems(items: LedgerItem[]) {
  if (!items.length) throw new Error('At least one item is required');
  for (const item of items) {
    if (!item.inventoryId) throw new Error('Inventory item is required');
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      throw new Error('Item quantity must be greater than zero');
    }
  }
}

export function applyApprovedTransfer(input: {
  central: StockMap;
  courier: StockMap;
  items: LedgerItem[];
}) {
  assertValidItems(input.items);
  const central = { ...input.central };
  const courier = { ...input.courier };

  for (const item of input.items) {
    const centralQty = central[item.inventoryId] ?? 0;
    if (centralQty < item.quantity) {
      throw new Error(`Insufficient central stock for ${item.inventoryId}`);
    }
    central[item.inventoryId] = centralQty - item.quantity;
    courier[item.inventoryId] = (courier[item.inventoryId] ?? 0) + item.quantity;
  }

  return { central, courier };
}

export function applySaleToCourierStock(input: {
  courier: StockMap;
  items: LedgerItem[];
}) {
  assertValidItems(input.items);
  const courier = { ...input.courier };

  for (const item of input.items) {
    const currentQty = courier[item.inventoryId] ?? 0;
    if (currentQty < item.quantity) {
      throw new Error(`Insufficient courier stock for ${item.inventoryId}`);
    }
    courier[item.inventoryId] = currentQty - item.quantity;
  }

  return { courier };
}
