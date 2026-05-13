import React, { useEffect, useState } from 'react';
import { ShoppingCart, Users, FileText, AlertTriangle, TrendingUp, WifiOff } from 'lucide-react';
import { apiRequest } from '../../services/api';

export const AdminDashboard = () => {
  const [summary, setSummary] = useState({
    totalRequests: 0,
    pendingRequests: 0,
    activeCouriers: 0,
    lowStock: 0,
    todayRevenue: 0,
    todayActivity: 0,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<typeof summary>('/api/dashboard/admin')
      .then(data => { setSummary(data); setError(''); })
      .catch(err => setError(err?.message ?? 'Gagal memuat data dasbor.'));
  }, []);

  const cards = [
    { label: 'Total Permintaan', value: summary.totalRequests, icon: <FileText size={28} /> },
    { label: 'Restock Tertunda', value: summary.pendingRequests, icon: <AlertTriangle size={28} /> },
    { label: 'Kurir Aktif', value: summary.activeCouriers, icon: <Users size={28} /> },
    { label: 'Penjualan Hari Ini', value: `Rp ${summary.todayRevenue.toLocaleString('id-ID')}`, icon: <TrendingUp size={28} /> },
    { label: 'Aktivitas Hari Ini', value: summary.todayActivity, icon: <ShoppingCart size={28} /> },
    { label: 'Stok Pusat Rendah', value: summary.lowStock, icon: <AlertTriangle size={28} /> },
  ];

  return (
    <div>
      <h2 className="text-3xl font-black uppercase text-[#003B73] mb-6">Ikhtisar</h2>
      {error && (
        <div className="mb-6 flex items-start gap-3 bg-red-100 border-[3px] border-red-500 text-red-700 p-4 font-mono text-sm font-bold">
          <WifiOff size={20} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {cards.map(card => (
          <div key={card.label} className="bg-white border-[4px] border-black p-5 md:p-6 shadow-[6px_6px_0px_#FDC500] flex items-center gap-4 min-w-0">
            <div className="text-[#003B73] shrink-0">{card.icon}</div>
            <div className="min-w-0">
              <h3 className="font-mono text-[10px] sm:text-xs font-bold text-gray-500 mb-1 uppercase">{card.label}</h3>
              <p className="text-2xl md:text-4xl font-black text-[#003B73] break-words">{card.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
