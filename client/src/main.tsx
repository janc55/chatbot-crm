import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Layout';
import Dashboard from './Dashboard';
import Leads from './Leads';
import LeadDetail from './LeadDetail';
import Templates from './Templates';
import Settings from './Settings';
import Logs from './Logs';
import WhatsAppConnect from './WhatsAppConnect';
import QuickReplies from './QuickReplies';
import Login from './Login';
import Users from './Users';
import { ChatProvider } from './context/ChatContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './utils/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import api from './api';
import './index.css';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkConnection();
    } else {
      setLoading(false);
    }
  }, [user]);

  const checkConnection = async () => {
    try {
      const response = await api.get('/webhook/whatsapp/status');
      setIsConnected(response.data.status === 'connected');
    } catch (error) {
      console.error('Error checking connection:', error);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || (user && loading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A7CF3B] mx-auto mb-4"></div>
          <p className="text-[#A7CF3B] font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  // If logged in but not connected, show connection page
  // Except for admin routes or specific cases if needed
  if (user && isConnected === false) {
    return <WhatsAppConnect onConnected={() => setIsConnected(true)} />;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />

      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="leads" element={<Leads />} />
        <Route path="leads/:id" element={<LeadDetail />} />
        <Route path="quick-replies" element={<QuickReplies />} />
        <Route path="templates" element={<Templates />} />
        <Route path="settings" element={
          <AdminRoute>
            <Settings />
          </AdminRoute>
        } />
        <Route path="logs" element={
          <AdminRoute>
            <Logs />
          </AdminRoute>
        } />
        <Route path="users" element={
          <AdminRoute>
            <Users />
          </AdminRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
          <AppContent />
        </BrowserRouter>
      </ChatProvider>
    </AuthProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
