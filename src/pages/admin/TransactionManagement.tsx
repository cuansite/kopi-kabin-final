import React, { useState, useEffect, useRef } from 'react';
import { handleFirestoreError, OperationType } from '../../utils/firestoreErrorHandler';
import { apiRequest } from '../../services/api';
import { supabase } from '../../supabase';
import { ShoppingCart, TrendingUp, RefreshCw } from 'lucide-react';

interface SaleItem {
  inventoryId: string;
  name: string;
  price: number;
  quantity: number;
}

interface TransactionRecord {
  id: string;
  kurir_id: string;
  kurir_name: string;
  items: SaleItem[];
  total_amount: number;
  type: 'sale' | 'restock' | 'adjustment';
  created_at: string;
}

const TYPE_CONFIG = {
  sale:       { label: 'Sale',       cls: 'bg-green-100 text-green-700 border-green-400' },
  restock:    { label: 'Restock',    cls: 'bg-blue-100 text-blue-700 border-blue-400' },
  adjustment: { label: 'Adjustment', cls: 'bg-yellow-100 text-yellow-700 border-yellow-400' },
};

export const TransactionManagement = () => {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<'all' | 'sale' | 'restock' | 'adjustment'>('all');
  const [kurirFilter, setKurirFilter] = useState<string>('all');

  const loadRef = useRef<() => Promise<void>>();

  const load = async () => {
    try {
      setTransactions(await apiRequest<TransactionRecord[]>('/api/transactions'));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    } finally {
      setLoading(false);
    }
  };

  loadRef.current = load;

  useEffect(() => {
    load();

    // Auto-update when any kurir records a sale or restock is approved
    const channel = supabase
      .channel('admin-transactions')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) loadRef.current?.();
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const allKurirs = Array.from(new Set(transactions.map(t => t.kurir_name))).sort();

  const filtered = transactions.filter(t => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (kurirFilter !== 'all' && t.kurir_name !== kurirFilter) return false;
    return true;
  });

  const totalRevenue = filtered
    .filter(t => t.type === 'sale')
    .reduce((sum, t) => sum + t.total_amount, 0);

  const todayCount = filtered.filter(t =>
    new Date(t.created_at).toDateString() === new Date().toDateString()
  ).length;

  if (loading) return (
    <div className="p-8 font-mono font-bold text-center">Loading transactions...</div>
  );

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <div>
        <h2 className="text-3xl font-black uppercase text-[#003B73]">Transaction Management</h2>
        <p className="font-mono text-sm text-gray-600 mt-1">
          All kurir sales and stock movements.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border-[4px] border-black p-4 shadow-[6px_6px_0px_#FDC500] flex items-center gap-3 min-w-0">
          <ShoppingCart size={28} className="text-[#003B73] shrink-0" />
          <div className="min-w-0">
            <p className="font-mono text-[10px] text-gray-500 uppercase">Total Transactions</p>
            <p className="font-black text-2xl text-[#003B73]">{filtered.length}</p>
          </div>
        </div>
        <div className="bg-white border-[4px] border-black p-4 shadow-[6px_6px_0px_#FDC500] flex items-center gap-3 min-w-0">
          <TrendingUp size={28} className="text-green-600 shrink-0" />
          <div className="min-w-0">
            <p className="font-mono text-[10px] text-gray-500 uppercase">Sales Revenue</p>
            <p className="font-black text-xl lg:text-2xl text-[#003B73] break-words">Rp {totalRevenue.toLocaleString('id-ID')}</p>
          </div>
        </div>
        <div className="bg-white border-[4px] border-black p-4 shadow-[6px_6px_0px_#FDC500] flex items-center gap-3 min-w-0">
          <RefreshCw size={28} className="text-[#003B73] shrink-0" />
          <div>
            <p className="font-mono text-[10px] text-gray-500 uppercase">Today's Activity</p>
            <p className="font-black text-2xl text-[#003B73]">{todayCount}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-2 flex-wrap">
          {(['all', 'sale', 'restock', 'adjustment'] as const).map(f => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={`px-4 py-2 border-[2px] border-black font-bold uppercase text-sm transition-colors ${typeFilter === f ? 'bg-[#003B73] text-white' : 'bg-white hover:bg-gray-100'}`}
            >
              {f}
            </button>
          ))}
        </div>
        {allKurirs.length > 1 && (
          <select
            value={kurirFilter}
            onChange={e => setKurirFilter(e.target.value)}
            className="border-[2px] border-black px-3 py-2 font-mono text-sm font-bold bg-white outline-none focus:border-[#003B73] max-w-full"
          >
            <option value="all">All Kurirs</option>
            {allKurirs.map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border-[4px] border-black p-8 sm:p-12 text-center shadow-[8px_8px_0px_#FDC500]">
          <ShoppingCart className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="font-black text-xl text-[#003B73]">No Transactions</h3>
          <p className="font-mono text-sm text-gray-500 mt-1">
            No {typeFilter !== 'all' ? typeFilter : ''} transactions found.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map(tx => {
            const cfg = TYPE_CONFIG[tx.type] ?? TYPE_CONFIG.sale;
            return (
              <div key={tx.id} className="bg-white border-[4px] border-black p-4 shadow-[6px_6px_0px_#003B73]">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <p className="font-black text-lg text-[#003B73] break-words">{tx.kurir_name}</p>
                    <p className="font-mono text-[10px] text-gray-400">
                      {new Date(tx.created_at).toLocaleDateString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                      {' · '}ID: {tx.id.slice(0, 8)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start flex-wrap">
                    <span className={`px-2 py-1 border-[2px] font-mono text-xs font-bold uppercase ${cfg.cls}`}>
                      {cfg.label}
                    </span>
                    <span className="font-black text-base text-[#003B73]">
                      Rp {tx.total_amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="border-[2px] border-gray-200">
                  <div className="bg-gray-50 px-3 py-1 border-b-[2px] border-gray-200 font-mono text-[10px] font-bold uppercase text-gray-500">
                    Items
                  </div>
                  {(tx.items ?? []).map((item, i) => (
                    <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-3 px-3 py-2 font-mono text-sm border-b border-dashed border-gray-100 last:border-b-0">
                      <span className="break-words">{item.name}</span>
                      <span className="text-gray-500">x{item.quantity}</span>
                      <span className="font-bold">
                        Rp {((item.price || 0) * item.quantity).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
