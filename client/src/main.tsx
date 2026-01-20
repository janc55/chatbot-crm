import React from 'react';
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

import './index.css';
import InstancesDashboard from './InstancesDashboard';

function AppContent() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A7CF3B] mx-auto mb-4"></div>
          <p className="text-[#A7CF3B] font-medium">Cargando...</p>
        </div>
      </div>
    );
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

        {/* Admin Routes */}
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
        <Route path="instances" element={
          <AdminRoute>
            <InstancesDashboard />
          </AdminRoute>
        } />
        <Route path="instances/:id/connect" element={
          <AdminRoute>
            <WhatsAppConnect />
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
