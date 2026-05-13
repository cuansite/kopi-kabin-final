import React, { useState } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Package, Users, Settings, LogOut, FileText, Menu, X, ShoppingCart } from 'lucide-react';
import { AdminDashboard } from './AdminDashboard';
import { RequestManagement } from './RequestManagement';
import { InventoryManagement } from './InventoryManagement';
import { UserManagement } from './UserManagement';
import { CarouselConfig } from './CarouselConfig';
import { TransactionManagement } from './TransactionManagement';

export const AdminLayout = () => {
  const { user, userData, loading, signOut } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (loading) return null;
  if (!user || userData?.role !== 'admin') return <Navigate to="/login/admin" replace />;

  const navItems = [
    { name: 'Dasbor',      path: '/admin',               icon: <LayoutDashboard size={20} /> },
    { name: 'Permintaan',  path: '/admin/requests',      icon: <FileText size={20} /> },
    { name: 'Transaksi',   path: '/admin/transactions',  icon: <ShoppingCart size={20} /> },
    { name: 'Inventaris',  path: '/admin/inventory',     icon: <Package size={20} /> },
    { name: 'Pengguna',    path: '/admin/users',         icon: <Users size={20} /> },
    { name: 'Karousel',    path: '/admin/carousel',      icon: <Settings size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      {/* Mobile Topbar */}
      <div className="md:hidden bg-[#003B73] text-white p-4 flex items-center justify-between border-b-[4px] border-black sticky top-0 z-50">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tighter text-[#FDC500]">Admin OS</h1>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 border-[2px] border-white focus:outline-none">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex w-full md:w-64 bg-[#003B73] text-white border-b-[6px] md:border-b-0 md:border-r-[6px] border-black flex-col absolute md:static z-40 h-[calc(100vh-76px)] md:h-screen sticky top-[76px] md:top-0`}>
        <div className="hidden md:block p-6 border-b-[4px] border-white/20">
          <h1 className="text-2xl font-black uppercase tracking-tighter text-[#FDC500]">Admin OS</h1>
          <p className="font-mono text-xs opacity-70 mt-1">v.1.0_CORE</p>
        </div>
        
        <nav className="flex-grow p-4 flex flex-col gap-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 font-bold uppercase text-sm border-[2px] transition-all ${isActive ? 'bg-[#FDC500] text-[#003B73] border-black brutal-shadow-yellow' : 'border-transparent hover:border-white/30 text-white/80 hover:text-white'}`}
              >
                {item.icon}
                {item.name}
              </Link>
            )
          })}
        </nav>
        
        <div className="p-4 border-t-[4px] border-white/20 mt-auto flex flex-col gap-3">
           <Link 
             to="/kurir"
             className="w-full flex items-center justify-center gap-2 px-4 py-3 border-[2px] border-[#FDC500] text-[#FDC500] hover:bg-[#FDC500] hover:text-[#003B73] font-bold uppercase text-sm transition-colors"
           >
             Portal Kurir
           </Link>
           <button 
             onClick={signOut}
             className="w-full flex items-center justify-center gap-2 px-4 py-3 border-[2px] border-red-500 text-red-400 hover:bg-red-500 hover:text-white font-bold uppercase text-sm transition-colors"
           >
             <LogOut size={20} /> Keluar
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-8 overflow-y-auto w-full">
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/requests" element={<RequestManagement />} />
          <Route path="/transactions" element={<TransactionManagement />} />
          <Route path="/inventory" element={<InventoryManagement />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/carousel" element={<CarouselConfig />} />
        </Routes>
      </main>
    </div>
  );
};
