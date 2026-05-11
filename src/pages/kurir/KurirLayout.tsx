import React from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, ShoppingCart, History, PackagePlus, LogOut, CheckCircle, XCircle, X } from 'lucide-react';
import { KurirProvider, useKurir, KurirToast } from '../../context/KurirContext';
import { KurirDashboard } from './KurirDashboard';
import { NewRequest } from './NewRequest';
import { RequestHistory } from './RequestHistory';
import { TransactionTracker } from './TransactionTracker';

const ToastRenderer = () => {
  const { toasts, dismissToast } = useKurir();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col gap-2 p-3 pointer-events-none">
      {toasts.map(toast => (
        <KurirToastCard key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
};

const KurirToastCard = ({ toast, onDismiss }: { toast: KurirToast; onDismiss: (id: string) => void }) => {
  const isApproved = toast.variant === 'approved' || toast.variant === 'success';
  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 border-[4px] border-black p-3 shadow-[4px_4px_0px_black] font-mono text-sm font-bold max-w-sm mx-auto w-full
        ${isApproved ? 'bg-green-400 text-black' : 'bg-red-400 text-white'}`}
    >
      {isApproved
        ? <CheckCircle size={18} className="shrink-0" />
        : <XCircle size={18} className="shrink-0" />}
      <span className="flex-1">{toast.message}</span>
      <button onClick={() => onDismiss(toast.id)} className="shrink-0 hover:opacity-70 transition-opacity">
        <X size={16} />
      </button>
    </div>
  );
};

const KurirLayoutInner = () => {
  const { user, userData, loading, signOut } = useAuth();
  const { hasLowStock } = useKurir();
  const location = useLocation();

  if (loading) return null;
  if (!user || (userData?.role !== 'kurir' && userData?.role !== 'admin')) return <Navigate to="/login/kurir" replace />;

  const navItems = [
    { name: 'Home',    path: '/kurir',         icon: <LayoutDashboard size={24} /> },
    {
      name: 'Request', path: '/kurir/request',
      icon: (
        <div className="relative">
          <PackagePlus size={24} />
          {hasLowStock && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-[2px] border-white rounded-full" />
          )}
        </div>
      ),
    },
    { name: 'History', path: '/kurir/history',  icon: <History size={24} /> },
    { name: 'Sales',   path: '/kurir/sales',    icon: <ShoppingCart size={24} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans pb-20">
      <ToastRenderer />

      {/* Header */}
      <header className="bg-[#003B73] text-white p-4 flex justify-between items-center shadow-md sticky top-0 z-40 border-b-[4px] border-black">
        <div className="min-w-0">
          <h1 className="font-black uppercase tracking-tighter text-[#FDC500] text-xl">Kabin Kurir</h1>
          <p className="font-mono text-[10px] opacity-80 truncate">{userData.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={signOut} className="p-3 hover:bg-white/10 border-[2px] border-white/20 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 overflow-x-hidden">
        <Routes>
          <Route path="/" element={<KurirDashboard />} />
          <Route path="/request" element={<NewRequest />} />
          <Route path="/history" element={<RequestHistory />} />
          <Route path="/sales" element={<TransactionTracker />} />
        </Routes>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-[4px] border-black flex z-50">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 flex flex-col items-center justify-center min-h-[64px] p-2 gap-1 transition-colors ${isActive ? 'text-[#003B73] border-t-[4px] border-[#FDC500] -mt-[4px] bg-blue-50' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              {item.icon}
              <span className="text-[10px] font-bold uppercase">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export const KurirLayout = () => {
  const { loading } = useAuth();
  if (loading) return null;

  return (
    <KurirProvider>
      <KurirLayoutInner />
    </KurirProvider>
  );
};
