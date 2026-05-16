import React, { useState, useMemo } from 'react';
import { useKurir, SaleItem } from '../../context/KurirContext';
import { Plus, Minus, ShoppingCart, AlertCircle, Package, X, Receipt } from 'lucide-react';

export const TX_TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  sale:       { label: 'Penjualan',  cls: 'bg-green-100 text-green-700 border-green-400' },
  restock:    { label: 'Restock',    cls: 'bg-blue-100 text-blue-700 border-blue-400' },
  adjustment: { label: 'Penyesuaian', cls: 'bg-yellow-100 text-yellow-700 border-yellow-400' },
};

export const TransactionTracker = () => {
  const { stock, transactions, loadingStock, loadingTransactions, todayRevenue, recordSale, addToast } = useKurir();

  const [showSaleModal, setShowSaleModal] = useState(false);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const todayStr = useMemo(() => new Date().toDateString(), []);

  const todayCount = useMemo(
    () => transactions.filter(t => t.type === 'sale' && new Date(t.created_at).toDateString() === todayStr).length,
    [transactions, todayStr],
  );

  const total = useMemo(
    () => cart.reduce((sum, c) => sum + c.price * c.quantity, 0),
    [cart],
  );

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

  const handleSubmit = () => {
    if (cart.length === 0 || isSubmitting) return;
    const itemsToSubmit = cart;
    const totalToSubmit = total;
    setIsSubmitting(true);
    setError('');
    // Close modal + confirm immediately — recordSale applies optimistic state synchronously
    setCart([]);
    setShowSaleModal(false);
    addToast({ id: crypto.randomUUID(), variant: 'success', message: 'Penjualan berhasil dicatat!' });
    recordSale(itemsToSubmit, totalToSubmit)
      .catch((err: any) => {
        addToast({
          id: crypto.randomUUID(),
          variant: 'error',
          message: err?.message ?? 'Gagal mencatat penjualan. Coba lagi.',
        });
      })
      .finally(() => setIsSubmitting(false));
  };

  const openModal = () => {
    setCart([]);
    setError('');
    setShowSaleModal(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setCart([]);
    setError('');
    setShowSaleModal(false);
  };

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
      <div className="bg-[#003B73] text-white border-[4px] border-black p-4 shadow-[4px_4px_0px_#FDC500]">
        <h2 className="font-black text-xl uppercase mb-1">Pelacak Transaksi</h2>
        <p className="font-mono text-xs opacity-80">Catat penjualan dari stok kurir yang disetujui.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border-[4px] border-black p-3 text-center shadow-[3px_3px_0px_#FDC500]">
          <p className="font-mono text-[10px] text-gray-500 uppercase">Pendapatan Hari Ini</p>
          <p className="font-black text-lg sm:text-xl text-[#003B73] break-words">
            Rp {todayRevenue.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="bg-white border-[4px] border-black p-3 text-center shadow-[3px_3px_0px_#FDC500]">
          <p className="font-mono text-[10px] text-gray-500 uppercase">Transaksi Hari Ini</p>
          <p className="font-black text-xl text-[#003B73]">{todayCount}</p>
        </div>
      </div>

      <button
        onClick={openModal}
        disabled={loadingStock}
        className="w-full bg-[#FDC500] text-black font-black py-4 uppercase tracking-widest border-[4px] border-black hover:bg-[#e5b200] transition-colors flex items-center justify-center gap-2 shadow-[4px_4px_0px_#003B73] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus size={20} />
        Catat Penjualan
      </button>

      <div className="bg-white border-[4px] border-black overflow-hidden shadow-[4px_4px_0px_#FDC500]">
        <div className="flex items-center justify-between p-4 border-b-[2px] border-black bg-gray-50">
          <span className="font-black uppercase text-[#003B73]">Riwayat Transaksi</span>
          {loadingTransactions ? (
            <span className="font-mono text-xs text-gray-400">Memuat...</span>
          ) : (
            <span className="font-mono text-xs text-gray-500">{transactions.length} total</span>
          )}
        </div>

        {loadingTransactions ? (
          <div className="p-6 text-center font-mono text-sm text-gray-500">Memuat transaksi...</div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center">
            <Receipt className="mx-auto mb-3 text-gray-300" size={40} />
            <p className="font-mono text-sm text-gray-500">Belum ada transaksi.</p>
          </div>
        ) : (
          <div className="divide-y-[2px] divide-gray-100">
            {transactions.map(tx => {
              const badge = TX_TYPE_BADGE[tx.type] ?? TX_TYPE_BADGE.sale;
              const isToday = new Date(tx.created_at).toDateString() === todayStr;
              const items = tx.items ?? [];
              return (
                <div key={tx.id} className={`p-4 ${isToday ? 'bg-yellow-50' : ''}`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] text-gray-400">
                        {new Date(tx.created_at).toLocaleDateString('id-ID', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                        {isToday && <span className="ml-1 text-[#003B73] font-bold">· Hari Ini</span>}
                      </p>
                      <p className="font-mono text-xs text-gray-400 mt-0.5">
                        {items.length} item{items.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 border-[2px] font-mono text-[10px] font-bold uppercase ${badge.cls}`}>
                        {badge.label}
                      </span>
                      <span className="font-black text-sm text-[#003B73]">
                        Rp {tx.total_amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {items.map((item, i) => (
                      <div key={i} className="flex justify-between gap-3 font-mono text-xs text-gray-600">
                        <span className="break-words">{item.name}</span>
                        <span className="shrink-0 text-gray-400">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showSaleModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/60" onClick={closeModal} />

          <div className="relative w-full sm:max-w-lg bg-white border-[4px] border-black shadow-[8px_8px_0px_#FDC500] flex flex-col max-h-[90vh] sm:max-h-[85vh]">
            <div className="flex items-center justify-between bg-[#003B73] text-white p-4 border-b-[4px] border-black shrink-0">
              <div>
                <h3 className="font-black text-lg uppercase">Catat Penjualan</h3>
                <p className="font-mono text-[10px] opacity-80">Pilih item yang terjual dari stok kurir Anda</p>
              </div>
              <button
                onClick={closeModal}
                disabled={isSubmitting}
                className="w-9 h-9 flex items-center justify-center border-[2px] border-white/50 hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {error && (
                <div className="m-4 bg-red-100 border-[3px] border-red-500 text-red-700 p-3 flex items-start gap-3">
                  <AlertCircle className="shrink-0 mt-0.5" size={18} />
                  <p className="font-mono text-sm font-bold">{error}</p>
                </div>
              )}

              {loadingStock ? (
                <div className="p-8 text-center font-mono font-bold">Memuat stok kurir...</div>
              ) : stock.length === 0 ? (
                <div className="p-8 text-center">
                  <Package className="mx-auto mb-4 text-gray-400" size={48} />
                  <h3 className="font-black text-xl text-[#003B73]">Tidak Ada Stok Kurir</h3>
                  <p className="font-mono text-sm text-gray-500 mt-2">
                    Kirim permintaan dan tunggu persetujuan admin sebelum berjualan.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-gray-50 px-4 py-2 border-b-[2px] border-gray-200 font-mono text-[10px] font-bold uppercase text-gray-500">
                    Pilih Item Terjual
                  </div>
                  {stock.map((row, i) => {
                    const item = row.inventory;
                    const qty = getQty(item.id);
                    return (
                      <div
                        key={row.inventory_id}
                        className={`p-4 flex items-center justify-between gap-3 ${i !== stock.length - 1 ? 'border-b-[2px] border-gray-100' : ''}`}
                      >
                        <div className="min-w-0">
                          <h4 className="font-bold text-[#003B73] break-words">{item.name}</h4>
                          <p className="font-mono text-[10px] text-gray-500">
                            Rp {Number(item.price).toLocaleString('id-ID')} · Stok: {row.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateCart(row, -1)}
                            disabled={qty === 0}
                            className="w-10 h-10 flex items-center justify-center border-[2px] border-black bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="font-mono font-bold w-6 text-center">{qty}</span>
                          <button
                            type="button"
                            onClick={() => updateCart(row, 1)}
                            disabled={qty >= row.quantity}
                            className="w-10 h-10 flex items-center justify-center border-[2px] border-black bg-[#FDC500] hover:bg-[#e5b200] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {cart.length > 0 && (
                    <div className="m-4 bg-gray-50 border-[3px] border-black p-4">
                      <p className="font-black uppercase text-sm text-[#003B73] mb-3 border-b-[2px] border-gray-200 pb-2">
                        Ringkasan Pesanan
                      </p>
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
                </>
              )}
            </div>

            <div className="p-4 border-t-[4px] border-black shrink-0 bg-white" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
              <button
                onClick={handleSubmit}
                disabled={cart.length === 0 || isSubmitting}
                className="w-full bg-[#003B73] text-[#FDC500] font-black py-4 uppercase tracking-widest border-[4px] border-black hover:bg-black hover:text-[#FDC500] transition-colors flex items-center justify-center gap-2 shadow-[4px_4px_0px_#FDC500] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#003B73] disabled:shadow-none"
              >
                {isSubmitting ? 'Memproses...' : (
                  <><ShoppingCart size={20} /> Catat Penjualan</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
