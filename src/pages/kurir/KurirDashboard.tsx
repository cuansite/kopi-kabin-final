import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useKurir, SaleItem } from '../../context/KurirContext';
import { Package, ShoppingCart, Clock, MapPin, TrendingUp, AlertTriangle, Target, Zap, Plus, Minus, AlertCircle } from 'lucide-react';

export const KurirDashboard = () => {
  const { userData } = useAuth();
  const {
    stock,
    currentLocation,
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
  } = useKurir();

  const [quickCart, setQuickCart] = useState<Record<string, number>>({});
  const [isQuickSelling, setIsQuickSelling] = useState(false);
  const [quickSellError, setQuickSellError] = useState('');

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
    } catch (err: any) {
      setQuickSellError(err?.message ?? 'Failed to record sale. Try again.');
    } finally {
      setIsQuickSelling(false);
    }
  };

  const statusColor: Record<string, string> = {
    pending:  'bg-yellow-400 text-black',
    approved: 'bg-green-400 text-black',
    rejected: 'bg-red-400 text-white',
  };

  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">

      {/* Low Stock Banner */}
      {hasLowStock && (
        <div className="bg-red-100 border-[4px] border-red-500 p-4 shadow-[4px_4px_0px_#ef4444]">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
            <div className="min-w-0">
              <p className="font-black text-red-700 uppercase text-sm">Low Stock Alert</p>
              <p className="font-mono text-xs text-red-600 mt-0.5">
                {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} running low or empty.
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
            Request Restock →
          </Link>
        </div>
      )}

      {/* Greeting */}
      <div className="bg-[#003B73] text-white border-[4px] border-black p-4 shadow-[4px_4px_0px_#FDC500]">
        <p className="font-mono text-xs opacity-70 uppercase tracking-widest">Dashboard</p>
        <p className="font-black text-xl text-[#FDC500] mt-1">{userData?.name ?? 'Courier'}</p>
      </div>

      {/* Location */}
      <div className={`border-[4px] border-black p-4 shadow-[4px_4px_0px_#003B73] ${currentLocation ? 'bg-[#FDC500]' : 'bg-white'}`}>
        <div className="flex items-center gap-3">
          <MapPin className="text-[#003B73] shrink-0" size={22} />
          <div className="min-w-0">
            <p className="font-mono text-[10px] text-[#003B73]/70 uppercase font-bold">Today's Location</p>
            <p className="font-black text-[#003B73] break-words">
              {currentLocation ?? 'No location assigned yet'}
            </p>
          </div>
        </div>
      </div>

      {/* Revenue today + sales count */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#003B73] text-white border-[4px] border-black p-4 shadow-[4px_4px_0px_#FDC500]">
          <ShoppingCart className="text-[#FDC500] mb-2" size={22} />
          <p className="font-mono text-[10px] opacity-80 uppercase">Today</p>
          <p className="font-black text-lg text-[#FDC500] break-words">Rp {todayRevenue.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-white border-[4px] border-black p-4 shadow-[4px_4px_0px_#003B73]">
          <Clock className="text-[#003B73] mb-2" size={22} />
          <p className="font-mono text-[10px] text-gray-500 uppercase">Sales Count</p>
          <p className="font-black text-2xl text-[#003B73]">{todayActivity}</p>
        </div>
      </div>

      {/* Daily Target Progress */}
      {dailyTarget !== null && dailyTarget > 0 && (
        <div className="bg-white border-[4px] border-black p-4 shadow-[4px_4px_0px_#FDC500]">
          <div className="flex items-center gap-3 mb-2">
            <Target className="text-[#003B73]" size={22} />
            <h2 className="font-black text-lg uppercase text-[#003B73]">Daily Target</h2>
            <span className="ml-auto font-black text-sm text-[#003B73]">{Math.round(dailyTargetProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 border-[2px] border-black h-4">
            <div
              className={`h-full transition-all duration-500 ${dailyTargetProgress >= 100 ? 'bg-green-500' : 'bg-[#FDC500]'}`}
              style={{ width: `${dailyTargetProgress}%` }}
            />
          </div>
          <p className="font-mono text-[10px] text-gray-500 mt-2">
            Rp {todayRevenue.toLocaleString('id-ID')} / Rp {dailyTarget.toLocaleString('id-ID')} target
            {dailyTargetProgress >= 100 && (
              <span className="ml-2 text-green-600 font-bold">🎉 Target reached!</span>
            )}
          </p>
        </div>
      )}

      {/* Weekly earnings */}
      <div className="bg-white border-[4px] border-black p-4 shadow-[4px_4px_0px_#FDC500]">
        <div className="flex items-center gap-3 mb-1">
          <TrendingUp className="text-[#003B73]" size={22} />
          <h2 className="font-black text-lg uppercase text-[#003B73]">7-Day Earnings</h2>
        </div>
        <p className="font-black text-2xl text-[#003B73]">Rp {weekRevenue.toLocaleString('id-ID')}</p>
        <p className="font-mono text-[10px] text-gray-400 uppercase mt-1">Total sales from the last 7 days</p>
      </div>

      {/* Quick Sell Panel */}
      {topSoldItems.length > 0 && (
        <div className="bg-white border-[4px] border-black shadow-[4px_4px_0px_#FDC500] overflow-hidden">
          <div className="px-4 py-3 bg-[#003B73] flex items-center gap-2">
            <Zap className="text-[#FDC500]" size={18} />
            <h2 className="font-black text-sm uppercase text-[#FDC500]">Quick Sell</h2>
            <span className="font-mono text-[10px] text-white/60 ml-1">Top items</span>
          </div>

          {topSoldItems.map((item, i) => {
            const inCart = quickCart[item.inventoryId] ?? 0;
            const maxQty = item.stockRow?.quantity ?? 0;
            return (
              <div key={item.inventoryId} className={`p-4 flex items-center justify-between gap-3 ${i !== topSoldItems.length - 1 ? 'border-b-[2px] border-gray-200' : ''}`}>
                <div className="min-w-0">
                  <h4 className="font-bold text-[#003B73] break-words text-sm">{item.name}</h4>
                  <p className="font-mono text-[10px] text-gray-500">
                    Rp {item.price.toLocaleString('id-ID')} · Stock: {maxQty}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateQuickCart(item.inventoryId, -1, maxQty)}
                    disabled={inCart === 0}
                    className="w-9 h-9 flex items-center justify-center border-[2px] border-black bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="font-mono font-bold w-5 text-center text-sm">{inCart}</span>
                  <button
                    type="button"
                    onClick={() => updateQuickCart(item.inventoryId, 1, maxQty)}
                    disabled={inCart >= maxQty}
                    className="w-9 h-9 flex items-center justify-center border-[2px] border-black bg-[#FDC500] hover:bg-[#e5b200] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              <span className="font-bold text-gray-600">Total:</span>
              <span className="font-black text-[#003B73]">Rp {quickCartTotal.toLocaleString('id-ID')}</span>
            </div>
          )}

          <div className="p-4 border-t-[2px] border-black">
            <button
              onClick={handleQuickSell}
              disabled={!hasQuickCart || isQuickSelling}
              className="w-full bg-[#003B73] text-[#FDC500] font-black py-3 uppercase tracking-widest border-[3px] border-black hover:bg-black hover:text-[#FDC500] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#003B73] text-sm"
            >
              {isQuickSelling ? 'Processing...' : (
                <><Zap size={16} /> Record Quick Sale</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Stock summary */}
      <div className="bg-white border-[4px] border-black p-4 shadow-[4px_4px_0px_#FDC500]">
        <div className="flex items-center gap-3 mb-3">
          <Package className="text-[#003B73]" size={24} />
          <h2 className="font-black text-xl uppercase text-[#003B73]">Current Stock</h2>
        </div>
        {loadingStock ? (
          <p className="font-mono text-sm text-gray-400">Loading stock...</p>
        ) : (
          <p className="font-mono text-sm text-gray-600">
            {stock.length === 0
              ? 'No stock assigned yet.'
              : `${stock.length} items assigned. ${lowStockItems.length > 0 ? `${lowStockItems.length} low or empty.` : 'All stocked.'}`}
          </p>
        )}
      </div>

      {/* Latest request */}
      <div className="bg-[#003B73] text-white border-[4px] border-black p-4 shadow-[4px_4px_0px_#FDC500]">
        <h2 className="font-black text-xl uppercase mb-1 text-[#FDC500]">Latest Request</h2>
        {latestRequest ? (
          <div className="flex justify-between items-center gap-3 mt-2">
            <span className="font-mono text-xs">REQ-{latestRequest.id.slice(0, 8)}</span>
            <span className={`px-2 py-1 font-bold text-xs uppercase border-[2px] border-black ${statusColor[latestRequest.status] ?? 'bg-yellow-400 text-black'}`}>
              {latestRequest.status}
            </span>
          </div>
        ) : (
          <p className="font-mono text-sm opacity-80 mt-2">No requests submitted yet.</p>
        )}
      </div>

      {/* Inventory list */}
      {stock.length > 0 && (
        <div className="bg-white border-[4px] border-black overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b-[2px] border-black font-mono text-[10px] font-bold uppercase text-gray-500">
            Assigned Inventory
          </div>
          {stock.slice(0, 8).map(row => (
            <div key={row.inventory_id} className="flex justify-between gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0 font-mono text-sm">
              <span className="font-bold text-[#003B73] break-words">{row.inventory?.name ?? row.inventory_id}</span>
              <span className={`shrink-0 font-bold ${row.quantity <= (row.inventory?.min_stock_level ?? 3) ? 'text-red-600' : ''}`}>
                x{row.quantity}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
