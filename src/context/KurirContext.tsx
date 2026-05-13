import React, { createContext, useContext, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { supabase } from '../supabase';
import { apiRequest } from '../services/api';
import { useAuth } from './AuthContext';

export interface CourierStockRow {
  inventory_id: string;
  quantity: number;
  inventory: {
    id: string;
    name: string;
    price: number;
    cat: string;
    power: string;
    desc: string;
    image_url?: string;
    min_stock_level?: number;
  };
}

export interface RequestRecord {
  id: string;
  kurir_id: string;
  kurir_name: string;
  items: { inventoryId: string; name: string; quantity: number }[];
  status: 'pending' | 'approved' | 'rejected';
  note: string;
  created_at: string;
}

export interface TransactionRecord {
  id: string;
  kurir_id: string;
  kurir_name: string;
  items: { inventoryId: string; name: string; price: number; quantity: number }[];
  total_amount: number;
  type: 'sale' | 'restock' | 'adjustment';
  created_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  stock_level: number;
  price: number;
}

export interface SaleItem {
  inventoryId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface TopSoldItem {
  inventoryId: string;
  name: string;
  price: number;
  frequency: number;
  stockRow?: CourierStockRow;
}

export type ToastVariant = 'approved' | 'rejected' | 'success' | 'error';

export interface KurirToast {
  id: string;
  variant: ToastVariant;
  message: string;
}

interface KurirContextType {
  stock: CourierStockRow[];
  requests: RequestRecord[];
  transactions: TransactionRecord[];
  inventory: InventoryItem[];
  currentLocation: string | null;
  dailyTarget: number | null;

  loadingStock: boolean;
  loadingRequests: boolean;
  loadingTransactions: boolean;
  loadingInventory: boolean;

  todayRevenue: number;
  weekRevenue: number;
  todayActivity: number;
  latestRequest: RequestRecord | null;
  lowStockItems: CourierStockRow[];
  hasLowStock: boolean;
  topSoldItems: TopSoldItem[];
  dailyTargetProgress: number;

  toasts: KurirToast[];
  dismissToast: (id: string) => void;

  recordSale: (items: SaleItem[], total: number) => Promise<void>;
  submitRequest: (items: { inventoryId: string; name: string; quantity: number }[], note: string) => Promise<void>;

  refetchAll: () => void;
}

const KurirContext = createContext<KurirContextType | null>(null);

export const KurirProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id;

  const [stock, setStock] = useState<CourierStockRow[]>([]);
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [currentLocation, setCurrentLocation] = useState<string | null>(null);
  const [dailyTarget, setDailyTarget] = useState<number | null>(null);

  const [loadingStock, setLoadingStock] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [loadingInventory, setLoadingInventory] = useState(true);

  const [toasts, setToasts] = useState<KurirToast[]>([]);

  // Tracks last-seen request statuses to detect pending→approved/rejected transitions
  const prevRequestStatusesRef = useRef<Record<string, string>>({});

  // Stable refs for realtime callbacks to avoid stale closures
  const loadStockRef = useRef<() => Promise<void>>();
  const loadRequestsRef = useRef<() => Promise<void>>();
  const loadTransactionsRef = useRef<() => Promise<void>>();

  const addToast = useCallback((toast: KurirToast) => {
    setToasts(prev => [...prev, toast]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toast.id)), 5000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const loadStock = async () => {
    try {
      const data = await apiRequest<CourierStockRow[]>('/api/courier-stock');
      setStock(data);
    } catch (err) {
      console.error('Failed to load stock:', err);
    } finally {
      setLoadingStock(false);
    }
  };

  const loadRequests = async () => {
    try {
      const data = await apiRequest<RequestRecord[]>('/api/requests');
      // Seed status map without overwriting entries already tracked (preserves transition detection)
      data.forEach(r => {
        if (!(r.id in prevRequestStatusesRef.current)) {
          prevRequestStatusesRef.current[r.id] = r.status;
        }
      });
      setRequests(data);
    } catch (err) {
      console.error('Failed to load requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const data = await apiRequest<TransactionRecord[]>('/api/transactions');
      setTransactions(data);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const loadInventory = async () => {
    try {
      const data = await apiRequest<InventoryItem[]>('/api/inventory');
      setInventory(data);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoadingInventory(false);
    }
  };

  const loadMeta = async () => {
    try {
      const data = await apiRequest<{
        currentLocation: string | null;
        dailyTarget: number | null;
        [key: string]: unknown;
      }>('/api/dashboard/kurir');
      setCurrentLocation(data.currentLocation ?? null);
      setDailyTarget(data.dailyTarget ?? null);
    } catch (err) {
      console.error('Failed to load dashboard meta:', err);
    }
  };

  loadStockRef.current = loadStock;
  loadRequestsRef.current = loadRequests;
  loadTransactionsRef.current = loadTransactions;

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      loadMeta(),
      loadStock(),
      loadRequests(),
      loadTransactions(),
      loadInventory(),
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const stockChannel = supabase
      .channel(`kurir-stock-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'courier_stock', filter: `kurir_id=eq.${userId}` },
        async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) loadStockRef.current?.();
        },
      )
      .subscribe();

    const requestsChannel = supabase
      .channel(`kurir-requests-${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'requests', filter: `kurir_id=eq.${userId}` },
        async (payload) => {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;

          const reqId = (payload.new as any)?.id as string | undefined;
          const newStatus = (payload.new as any)?.status as string | undefined;

          if (reqId && newStatus) {
            const prevStatus = prevRequestStatusesRef.current[reqId];
            if (prevStatus === 'pending' && (newStatus === 'approved' || newStatus === 'rejected')) {
              addToast({
                id: crypto.randomUUID(),
                variant: newStatus as ToastVariant,
                message: newStatus === 'approved'
                  ? 'Your restock request was approved!'
                  : 'Your restock request was rejected.',
              });
            }
            prevRequestStatusesRef.current[reqId] = newStatus;
          }

          loadRequestsRef.current?.();
        },
      )
      .subscribe();

    const transactionsChannel = supabase
      .channel(`kurir-transactions-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions', filter: `kurir_id=eq.${userId}` },
        async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) loadTransactionsRef.current?.();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(stockChannel);
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(transactionsChannel);
    };
  }, [userId, addToast]);

  const todayRevenue = useMemo(() => {
    const todayStr = new Date().toDateString();
    return transactions
      .filter(t => t.type === 'sale' && new Date(t.created_at).toDateString() === todayStr)
      .reduce((sum, t) => sum + Number(t.total_amount), 0);
  }, [transactions]);

  const weekRevenue = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);
    return transactions
      .filter(t => t.type === 'sale' && new Date(t.created_at) >= weekAgo)
      .reduce((sum, t) => sum + Number(t.total_amount), 0);
  }, [transactions]);

  const todayActivity = useMemo(() => {
    const todayStr = new Date().toDateString();
    return transactions.filter(t => t.type === 'sale' && new Date(t.created_at).toDateString() === todayStr).length;
  }, [transactions]);

  const latestRequest = useMemo(() => requests[0] ?? null, [requests]);

  const lowStockItems = useMemo(
    () => stock.filter(s => s.quantity <= (s.inventory?.min_stock_level ?? 3)),
    [stock],
  );

  const hasLowStock = useMemo(() => lowStockItems.length > 0, [lowStockItems]);

  const topSoldItems = useMemo<TopSoldItem[]>(() => {
    const freq: Record<string, { name: string; price: number; count: number }> = {};
    transactions
      .filter(tx => tx.type === 'sale')
      .forEach(tx => {
        (tx.items ?? []).forEach(item => {
          const id = item.inventoryId;
          if (!freq[id]) freq[id] = { name: item.name, price: Number(item.price), count: 0 };
          freq[id].count += 1;
        });
      });
    return Object.entries(freq)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3)
      .map(([inventoryId, meta]) => ({
        inventoryId,
        name: meta.name,
        price: meta.price,
        frequency: meta.count,
        stockRow: stock.find(s => s.inventory_id === inventoryId),
      }));
  }, [transactions, stock]);

  const dailyTargetProgress = useMemo(() => {
    if (!dailyTarget || dailyTarget <= 0) return 0;
    return Math.min(100, (todayRevenue / dailyTarget) * 100);
  }, [todayRevenue, dailyTarget]);

  const recordSale = useCallback(async (items: SaleItem[], total: number) => {
    await apiRequest('/api/transactions/sale', {
      method: 'POST',
      body: JSON.stringify({ items, totalAmount: total }),
    });
    await Promise.all([loadStockRef.current?.(), loadTransactionsRef.current?.()]);
  }, []);

  const submitRequest = useCallback(async (
    items: { inventoryId: string; name: string; quantity: number }[],
    note: string,
  ) => {
    await apiRequest('/api/requests', {
      method: 'POST',
      body: JSON.stringify({ items, note }),
    });
    await loadRequestsRef.current?.();
  }, []);

  const refetchAll = useCallback(() => {
    loadMeta();
    loadStockRef.current?.();
    loadRequestsRef.current?.();
    loadTransactionsRef.current?.();
    loadInventory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: KurirContextType = {
    stock,
    requests,
    transactions,
    inventory,
    currentLocation,
    dailyTarget,
    loadingStock,
    loadingRequests,
    loadingTransactions,
    loadingInventory,
    todayRevenue,
    weekRevenue,
    todayActivity,
    latestRequest,
    lowStockItems,
    hasLowStock,
    topSoldItems,
    dailyTargetProgress,
    toasts,
    dismissToast,
    recordSale,
    submitRequest,
    refetchAll,
  };

  return <KurirContext.Provider value={value}>{children}</KurirContext.Provider>;
};

export const useKurir = () => {
  const ctx = useContext(KurirContext);
  if (!ctx) throw new Error('useKurir must be used within KurirProvider');
  return ctx;
};
