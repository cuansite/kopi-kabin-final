import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useKurir, SaleItem } from '../../context/KurirContext';
import { Package, ShoppingCart, Clock, TrendingUp, AlertTriangle, Target, Zap, Plus, Minus, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu',
  approved: 'Disetujui',
  rejected: 'Ditolak',
};

const STATUS_COLOR: Record<string, string> = {
  pending:  'bg-yellow-400 text-black',
  approved: 'bg-green-400 text-black',
  rejected: 'bg-red-400 text-white',
};

export const KurirDashboard = () => {
  const { userData } = useAuth();
  const {
    stock,
    dailyTarget,
    todayRevenue,
    weekRevenue,
    todayActivity,
    latestRequest,
    lowStockItems,
    hasLowStock,
    topSoldItems,
    dailyTargetProgress,
    loadingStock,
    recordSale,
    addToast,
  } = useKurir();

  const [quickCart, setQuickCart] = useState<Record<string, number>>({});
  const [isQuickSelling, setIsQuickSelling] = useState(false);
  const [quickSellError, setQuickSellError] = useState('');
  const [showInventory, setShowInventory] = useState(false);

  const updateQuickCart = (inventoryId: string, delta: number, maxQty: number) => {
    setQuickCart(prev => {
      const current = prev[inventoryId] ?? 0;
      const next = Math.max(0, Math.min(maxQty, current + delta));
      if (next === 0) {
        const { [inventoryId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [inventoryId]: next };
    });
  };

  const quickCartTotal = Object.entries(quickCart).reduce((sum, [id, qty]) => {
    const item = topSoldItems.find(i => i.inventoryId === id);
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const hasQuickCart = Object.keys(quickCart).length > 0;

  const handleQuickSell = async () => {
    if (!hasQuickCart) return;
    setIsQuickSelling(true);
    setQuickSellError('');
    try {
      const items: SaleItem[] = topSoldItems
        .filter(item => (quickCart[item.inventoryId] ?? 0) > 0)
        .map(item => ({
          inventoryId: item.inventoryId,
          name: item.name,
          price: item.price,
          quantity: quickCart[item.inventoryId],
        }));
      await recordSale(items, quickCartTotal);
      setQuickCart({});
      addToast({ id: crypto.randomUUID(), variant: 'success', message: 'Penjualan berhasil dicatat!' });
    } catch (err: any) {
      setQuickSellError(err?.message ?? 'Gagal mencatat penjualan. Coba lagi.');
    } finally {
      setIsQuickSelling(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">

      {/* Low Stock Banner — urgent, stays at top */}
      {hasLowStock && (
        <div className="bg-red-100 border-[4px] border-red-500 p-4 shadow-[4px_4px_0px_#ef4444]">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
            <div className="min-w-0">
              <p className="font-black text-red-700 uppercase text-sm">Peringatan Stok Rendah</p>
              <p className="font-mono text-xs text-red-600 mt-0.5">
                {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} hampir habis atau kosong.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mb-3">
            {lowStockItems.map(row => (
              <span key={row.inventory_id} className="bg-red-200 text-red-800 border border-red-400 px-2 py-0.5 font-mono text-[10px] font-bold uppercase">
                {row.inventory?.name} ({row.quantity})
              </span>
            ))}
          </div>
          <Link
            to="/kurir/request"
            className="inline-block bg-red-600 text-white font-black text-xs uppercase px-4 py-2 border-[2px] border-black hover:bg-black transition-colors"
          >
            Minta Restock →
          </Link>
        </div>
      )}

      {/* Hero card — greeting + key stats combined */}
      <div className="bg-[#003B73] text-white border-[4px] border-black shadow-[4px_4px_0px_#FDC500]">
        <div className="px-4 pt-4 pb-3 border-b-[2px] border-white/20">
          <p className="font-mono text-[10px] opacity-60 uppercase tracking-widest">Dasbor</p>
          <p className="font-black text-xl text-[#FDC500]">{userData?.name ?? 'Kurir'}</p>
        </div>
        <div className="grid grid-cols-2 divide-x-[2px] divide-white/20">
          <div className="p-4">
            <ShoppingCart className="text-[#FDC500] mb-2 opacity-80" size={18} />
            <p className="font-mono text-[10px] opacity-70 uppercase">Pendapatan Hari Ini</p>
            <p className="font-black text-lg text-[#FDC500] break-words leading-tight mt-0.5">
              Rp {todayRevenue.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="p-4">
            <Clock className="text-white/60 mb-2" size={18} />
            <p className="font-mono text-[10px] opacity-70 uppercase">Jumlah Penjualan</p>
            <p className="font-black text-2xl text-white leading-tight mt-0.5">{todayActivity}</p>
          </div>
        </div>
      </div>

      {/* Jual Cepat — primary action, near top */}
      {topSoldItems.length > 0 && (
        <div className="bg-white border-[4px] border-black shadow-[4px_4px_0px_#FDC500] overflow-hidden">
          <div className="px-4 py-3 bg-[#003B73] flex items-center gap-2">
            <Zap className="text-[#FDC500]" size={18} />
            <h2 className="font-black text-sm uppercase text-[#FDC500]">Jual Cepat</h2>
            <span className="font-mono text-[10px] text-white/60 ml-1">Item terlaris</span>
          </div>

          {topSoldItems.map((item, i) => {
            const inCart = quickCart[item.inventoryId] ?? 0;
            const maxQty = item.stockRow?.quantity ?? 0;
            const isOutOfStock = maxQty === 0;
            return (
              <div
                key={item.inventoryId}
                className={`p-4 flex items-center justify-between gap-3 ${i !== topSoldItems.length - 1 ? 'border-b-[2px] border-gray-200' : ''}`}
              >
                <div className="min-w-0">
                  <h4 className="font-bold text-[#003B73] break-words text-sm">{item.name}</h4>
                  <div className="flex items-center gap-2 flex-wrap mt-0.5">
                    <p className="font-mono text-[10px] text-gray-500">
                      Rp {item.price.toLocaleString('id-ID')} · Stok: {maxQty}
                    </p>
                    {isOutOfStock && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-100 border border-red-300 px-1.5 py-0.5 uppercase font-mono leading-none">
                        Stok habis
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateQuickCart(item.inventoryId, -1, maxQty)}
                    disabled={inCart === 0}
                    className="w-9 h-9 flex items-center justify-center border-[2px] border-black bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="font-mono font-bold w-5 text-center text-sm">{inCart}</span>
                  <button
                    type="button"
                    onClick={() => updateQuickCart(item.inventoryId, 1, maxQty)}
                    disabled={inCart >= maxQty}
                    className="w-9 h-9 flex items-center justify-center border-[2px] border-black bg-[#FDC500] hover:bg-[#e5b200] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            );
          })}

          {quickSellError && (
            <div className="mx-4 mb-2 bg-red-100 border-[2px] border-red-500 text-red-700 p-2 flex items-start gap-2">
              <AlertCircle className="shrink-0 mt-0.5" size={14} />
              <p className="font-mono text-xs font-bold">{quickSellError}</p>
            </div>
          )}

          {hasQuickCart && (
            <div className="px-4 py-2 bg-gray-50 border-t-[2px] border-gray-200 flex justify-between items-center font-mono text-sm">
              <span className="font-bold text-gray-600">total:</span>
              <span className="font-black text-[#003B73]">Rp {quickCartTotal.toLocaleString('id-ID')}</span>
            </div>
          )}

          <div className="p-4 border-t-[2px] border-black">
            <button
              onClick={handleQuickSell}
              disabled={!hasQuickCart || isQuickSelling}
              className="w-full bg-[#003B73] text-[#FDC500] font-black py-3 uppercase tracking-widest border-[3px] border-black hover:bg-black hover:text-[#FDC500] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#003B73] text-sm"
            >
              {isQuickSelling ? 'Memproses...' : (
                <><Zap size={16} /> Catat Penjualan Cepat</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Stats — 7-day earnings + daily target in one compact area */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border-[4px] border-black p-4 shadow-[4px_4px_0px_#FDC500]">
          <TrendingUp className="text-[#003B73] mb-2" size={18} />
          <p className="font-mono text-[10px] text-gray-500 uppercase">7 Hari</p>
          <p className="font-black text-lg text-[#003B73] break-words leading-tight mt-0.5">
            Rp {weekRevenue.toLocaleString('id-ID')}
          </p>
        </div>

        {dailyTarget !== null && dailyTarget > 0 ? (
          <div className="bg-white border-[4px] border-black p-4 shadow-[4px_4px_0px_#FDC500]">
            <Target className="text-[#003B73] mb-2" size={18} />
            <p className="font-mono text-[10px] text-gray-500 uppercase">Target Harian</p>
            <p className="font-black text-lg text-[#003B73] leading-tight mt-0.5">
              {Math.round(dailyTargetProgress)}%
            </p>
            <div className="w-full bg-gray-200 border border-black h-2 mt-2">
              <div
                className={`h-full transition-all duration-500 ${dailyTargetProgress >= 100 ? 'bg-green-500' : 'bg-[#FDC500]'}`}
                style={{ width: `${Math.min(100, dailyTargetProgress)}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="bg-white border-[4px] border-black p-4 shadow-[4px_4px_0px_#FDC500] flex items-center justify-center">
            <p className="font-mono text-[10px] text-gray-400 text-center uppercase">Target belum ditetapkan</p>
          </div>
        )}
      </div>

      {/* Latest request — compact */}
      <div className="bg-[#003B73] text-white border-[4px] border-black p-4 shadow-[4px_4px_0px_#FDC500]">
        <h2 className="font-black text-sm uppercase mb-2 text-[#FDC500] tracking-wide">Permintaan Terbaru</h2>
        {latestRequest ? (
          <div className="flex justify-between items-center gap-3">
            <span className="font-mono text-xs opacity-80">REQ-{latestRequest.id.slice(0, 8)}</span>
            <span className={`px-2 py-1 font-bold text-xs uppercase border-[2px] border-black ${STATUS_COLOR[latestRequest.status] ?? 'bg-yellow-400 text-black'}`}>
              {STATUS_LABEL[latestRequest.status] ?? latestRequest.status}
            </span>
          </div>
        ) : (
          <p className="font-mono text-xs opacity-70">Belum ada permintaan yang diajukan.</p>
        )}
        <Link
          to="/kurir/request"
          className="inline-block mt-3 text-[10px] font-mono font-bold text-white/70 hover:text-[#FDC500] underline underline-offset-2 transition-colors uppercase"
        >
          + Buat Permintaan Baru
        </Link>
      </div>

      {/* Stock — collapsible */}
      {stock.length > 0 && (
        <div className="bg-white border-[4px] border-black overflow-hidden shadow-[4px_4px_0px_#FDC500]">
          <button
            onClick={() => setShowInventory(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border-b-[2px] border-black hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Package className="text-[#003B73]" size={18} />
              <span className="font-black text-sm uppercase text-[#003B73]">Stok Saat Ini</span>
              {loadingStock ? null : (
                <span className="font-mono text-[10px] text-gray-500">
                  ({stock.length} item
                  {lowStockItems.length > 0 ? `, ${lowStockItems.length} rendah` : ''})
                </span>
              )}
            </div>
            {showInventory ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>

          {showInventory && (
            loadingStock ? (
              <p className="font-mono text-sm text-gray-400 p-4">Memuat stok...</p>
            ) : (
              stock.slice(0, 8).map(row => (
                <div key={row.inventory_id} className="flex justify-between gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 font-mono text-sm">
                  <span className="font-bold text-[#003B73] break-words">{row.inventory?.name ?? row.inventory_id}</span>
                  <span className={`shrink-0 font-bold ${row.quantity <= (row.inventory?.min_stock_level ?? 3) ? 'text-red-600' : ''}`}>
                    x{row.quantity}
                  </span>
                </div>
              ))
            )
          )}
        </div>
      )}
    </div>
  );
};
