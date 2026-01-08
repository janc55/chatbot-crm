import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import Dashboard from './Dashboard';
import Leads from './Leads';
import LeadDetail from './LeadDetail';
import Templates from './Templates';
import Settings from './Settings';
import Logs from './Logs';
import WhatsAppConnect from './WhatsAppConnect';
import QuickReplies from './QuickReplies';
import { ChatProvider } from './context/ChatContext';
import api from './api';
import './index.css';

function App() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConnection();
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#064A6F] mx-auto mb-4"></div>
          <p className="text-[#064A6F] font-medium">Verificando conexión...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return <WhatsAppConnect onConnected={() => setIsConnected(true)} />;
  }

  return (
    <ChatProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="leads" element={<Leads />} />
            <Route path="leads/:id" element={<LeadDetail />} />
            <Route path="quick-replies" element={<QuickReplies />} />
            <Route path="templates" element={<Templates />} />
            <Route path="settings" element={<Settings />} />
            <Route path="logs" element={<Logs />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ChatProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
