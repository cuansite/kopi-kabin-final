import React, { useEffect, useState } from 'react';
import { ShoppingCart, Users, FileText, AlertTriangle, TrendingUp } from 'lucide-react';
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

  useEffect(() => {
    apiRequest<typeof summary>('/api/dashboard/admin')
      .then(setSummary)
      .catch(console.error);
  }, []);

  const cards = [
    { label: 'Total Requests', value: summary.totalRequests, icon: <FileText size={28} /> },
    { label: 'Pending Restocks', value: summary.pendingRequests, icon: <AlertTriangle size={28} /> },
    { label: 'Active Couriers', value: summary.activeCouriers, icon: <Users size={28} /> },
    { label: "Today's Sales", value: `Rp ${summary.todayRevenue.toLocaleString('id-ID')}`, icon: <TrendingUp size={28} /> },
    { label: "Today's Activity", value: summary.todayActivity, icon: <ShoppingCart size={28} /> },
    { label: 'Low Central Stock', value: summary.lowStock, icon: <AlertTriangle size={28} /> },
  ];

  return (
    <div>
      <h2 className="text-3xl font-black uppercase text-[#003B73] mb-6">Overview</h2>
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
