import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DocumentList from './pages/DocumentList';
import DocumentFormView from './pages/DocumentFormView';
import DocumentDetail from './pages/DocumentDetail';
import Settings from './pages/Settings';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';

// Main App component orchestrating routes
export default function App() {
  const checkSession = useAuthStore((state) => state.checkSession);

  // Simple global click listener to extend session if active
  React.useEffect(() => {
    const handleActivity = () => {
      checkSession();
      // Only extend if authenticated
      if (useAuthStore.getState().isAuthenticated) {
        useAuthStore.getState().extendSession();
      }
    };
    window.addEventListener('click', handleActivity);
    window.addEventListener('keydown', handleActivity);
    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [checkSession]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes using AppLayout */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/documents" element={<DocumentList />} />
          <Route path="/documents/new" element={<DocumentFormView />} />
          <Route path="/documents/edit/:id" element={<DocumentFormView />} />
          <Route path="/documents/:id" element={<DocumentDetail />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" toastOptions={{
        className: 'font-sans text-sm shadow-xl',
        duration: 3000,
        style: {
          background: '#1e293b',
          color: '#f8fafc',
          border: '1px solid #334155'
        }
      }} />
    </BrowserRouter>
  );
}
