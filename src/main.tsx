import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App.tsx';
import { AdminLayout } from './pages/admin/AdminLayout.tsx';
import { KurirLayout } from './pages/kurir/KurirLayout.tsx';
import { Login } from './pages/Login.tsx';
import { MenuProvider } from './context/MenuContext.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <MenuProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/login/admin" element={<Login type="admin" />} />
            <Route path="/login/kurir" element={<Login type="kurir" />} />
            <Route path="/login" element={<Navigate to="/login/admin" replace />} />
            <Route path="/admin/*" element={<AdminLayout />} />
            <Route path="/kurir/*" element={<KurirLayout />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </MenuProvider>
    </AuthProvider>
  </StrictMode>,
);
