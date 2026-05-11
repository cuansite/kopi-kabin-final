import React, { useState } from 'react';
import { useKurir, SaleItem } from '../../context/KurirContext';
import { Plus, Minus, ShoppingCart, AlertCircle, ChevronDown, ChevronUp, Package } from 'lucide-react';

export const TransactionTracker = () => {
  const { stock, transactions, loadingStock, loadingTransactions, todayRevenue, recordSale } = useKurir();

  const [cart, setCart] = useState<SaleItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const loading = loadingStock || loadingTransactions;

  const availableFor = (id: string) => stock.find(s => s.inventory_id === id)?.quantity ?? 0;
  const getQty = (id: string) => cart.find(c => c.inventoryId === id)?.quantity || 0;

  const updateCart = (row: typeof stock[number], delta: number) => {
    const item = row.inventory;
    setCart(prev => {
      const existing = prev.find(c => c.inventoryId === item.id);
      const current = existing?.quantity ?? 0;
      const nextQty = Math.max(0, Math.min(row.quantity, current + delta));
      if (existing) {
        if (nextQty === 0) return prev.filter(c => c.inventoryId !== item.id);
        return prev.map(c => c.inventoryId === item.id ? { ...c, quantity: nextQty } : c);
      }
      if (delta > 0 && nextQty > 0) {
        return [...prev, { inventoryId: item.id, name: item.name, price: Number(item.price), quantity: nextQty }];
      }
      return prev;
    });
  };

  const total = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

  const handleSubmit = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    setError('');
    try {
      await recordSale(cart, total);
      setCart([]);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to record sale. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
      <div className="bg-[#003B73] text-white border-[4px] border-black p-4 shadow-[4px_4px_0px_#FDC500]">
        <h2 className="font-black text-xl uppercase mb-1">Record Sale</h2>
        <p className="font-mono text-xs opacity-80">Sell only from stock approved for your courier route.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border-[4px] border-black p-3 text-center">
          <p className="font-mono text-[10px] text-gray-500 uppercase">Today's Sales</p>
          <p className="font-black text-lg sm:text-xl text-[#003B73] break-words">Rp {todayRevenue.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-white border-[4px] border-black p-3 text-center">
          <p className="font-mono text-[10px] text-gray-500 uppercase">Transactions</p>
          <p className="font-black text-xl text-[#003B73]">{transactions.length}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-[3px] border-red-500 text-red-700 p-3 flex items-start gap-3">
          <AlertCircle className="shrink-0 mt-0.5" size={18} />
          <p className="font-mono text-sm font-bold">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="bg-white border-[4px] border-black p-8 text-center font-mono font-bold">Loading courier stock...</div>
      ) : stock.length === 0 ? (
        <div className="bg-white border-[4px] border-black p-8 text-center shadow-[4px_4px_0px_#FDC500]">
          <Package className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="font-black text-xl text-[#003B73]">No Courier Stock</h3>
          <p className="font-mono text-sm text-gray-500 mt-2">Submit a request and wait for admin approval before selling.</p>
        </div>
      ) : (
        <div className="bg-white border-[4px] border-black shadow-[4px_4px_0px_#FDC500] overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b-[2px] border-black font-mono text-[10px] font-bold uppercase text-gray-500">
            Select Items Sold
          </div>
          {stock.map((row, i) => {
            const item = row.inventory;
            return (
              <div key={row.inventory_id} className={`p-4 flex items-center justify-between gap-3 ${i !== stock.length - 1 ? 'border-b-[2px] border-gray-200' : ''}`}>
                <div className="min-w-0">
                  <h4 className="font-bold text-[#003B73] break-words">{item.name}</h4>
                  <p className="font-mono text-[10px] text-gray-500">
                    Rp {Number(item.price).toLocaleString('id-ID')} · Courier Stock: {availableFor(item.id)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateCart(row, -1)}
                    disabled={getQty(item.id) === 0}
                    className="w-10 h-10 flex items-center justify-center border-[2px] border-black bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="font-mono font-bold w-6 text-center">{getQty(item.id)}</span>
                  <button
                    type="button"
                    onClick={() => updateCart(row, 1)}
                    disabled={getQty(item.id) >= row.quantity}
                    className="w-10 h-10 flex items-center justify-center border-[2px] border-black bg-[#FDC500] hover:bg-[#e5b200] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {cart.length > 0 && (
        <div className="bg-white border-[4px] border-black p-4 shadow-[4px_4px_0px_#FDC500]">
          <p className="font-black uppercase text-sm text-[#003B73] mb-3 border-b-[2px] border-gray-200 pb-2">Order Summary</p>
          {cart.map(c => (
            <div key={c.inventoryId} className="flex justify-between gap-3 font-mono text-sm py-1">
              <span className="break-words">{c.name} x{c.quantity}</span>
              <span className="font-bold shrink-0">Rp {(c.price * c.quantity).toLocaleString('id-ID')}</span>
            </div>
          ))}
          <div className="flex justify-between font-black text-base border-t-[2px] border-black mt-2 pt-2">
            <span>TOTAL</span>
            <span className="text-[#003B73]">Rp {total.toLocaleString('id-ID')}</span>
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={cart.length === 0 || isSubmitting}
        className="w-full bg-[#003B73] text-[#FDC500] font-black py-4 uppercase tracking-widest border-[4px] border-black hover:bg-black hover:text-[#FDC500] transition-colors flex items-center justify-center gap-2 shadow-[4px_4px_0px_#FDC500] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#003B73]"
      >
        {isSubmitting ? 'Processing...' : (
          <><ShoppingCart size={20} /> Record Sale</>
        )}
      </button>

      <div className="bg-white border-[4px] border-black overflow-hidden">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between p-4 font-black uppercase text-[#003B73] hover:bg-gray-50 transition-colors"
        >
          <span>Transaction History</span>
          {showHistory ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {showHistory && (
          <div className="border-t-[2px] border-black">
            {transactions.length === 0 ? (
              <p className="p-4 font-mono text-sm text-gray-500 text-center">No transactions yet.</p>
            ) : (
              transactions.map(tx => (
                <div key={tx.id} className="border-b-[2px] border-gray-100 p-4">
                  <div className="flex justify-between gap-3 items-start mb-2">
                    <p className="font-mono text-[10px] text-gray-400">
                      {new Date(tx.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <span className="font-black text-sm text-[#003B73] shrink-0">Rp {tx.total_amount.toLocaleString('id-ID')}</span>
                  </div>
                  {(tx.items ?? []).map(item => (
                    <div key={item.inventoryId} className="flex justify-between gap-3 font-mono text-xs text-gray-600">
                      <span className="break-words">{item.name}</span>
                      <span className="shrink-0">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
