import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import IndividualList from './pages/IndividualList';
import IndividualFormView from './pages/IndividualFormView';
import IndividualDetail from './pages/IndividualDetail';
import GroupRegistry from './pages/GroupRegistry';
import Settings from './pages/Settings';
import Recepciones from './pages/Recepciones';
import AssistanceRecord from './pages/AssistanceRecord';
import AdminPanel from './pages/AdminPanel';
import { Toaster } from 'react-hot-toast';
import { useAuthStore, ADMIN_EMAILS } from './store/authStore';
import SessionBarrier from './components/SessionBarrier';

const AdminRoute = ({ children }) => {
  const currentEmail = useAuthStore((state) => state.currentEmail);
  const isAdmin = currentEmail && ADMIN_EMAILS.includes(currentEmail.toLowerCase());
  return isAdmin ? children : <Navigate to="/" replace />;
};

// Main App component orchestrating routes
export default function App() {
  const checkSession = useAuthStore((state) => state.checkSession);
  const checkSessionConflict = useAuthStore((state) => state.checkSessionConflict);

  // Verificar conflicto de sesión al montar la app
  React.useEffect(() => {
    checkSessionConflict();
  }, [checkSessionConflict]);

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
      <SessionBarrier />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes using AppLayout */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/documents" element={<IndividualList />} />
          <Route path="/documents/new" element={<IndividualFormView />} />
          <Route path="/documents/edit/:id" element={<IndividualFormView />} />
          <Route path="/documents/:id" element={<IndividualDetail />} />
          <Route path="/documents/:id/assistance" element={<AssistanceRecord />} />
          <Route path="/groups" element={<GroupRegistry />} />
          <Route path="/recepciones" element={<Recepciones />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          } />
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
