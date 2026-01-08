import { useState, useEffect } from 'react';
import api from './api';
import toast from 'react-hot-toast';

interface LogEntry {
  timestamp: string;
  level: 'log' | 'error' | 'warn' | 'debug';
  message: string;
  context?: string;
}

interface HandoverAlert {
  leadId: string;
  leadPhone: string;
  leadName?: string;
  timestamp: string;
  message: string;
}

export default function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [handoverAlerts, setHandoverAlerts] = useState<HandoverAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'error' | 'warn' | 'log' | 'debug'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState<'logs' | 'alerts'>('logs');

  useEffect(() => {
    loadLogs();
    loadHandoverAlerts();

    if (autoRefresh) {
      const interval = setInterval(() => {
        loadLogs();
        loadHandoverAlerts();
      }, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [filter, autoRefresh]);

  const loadLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('level', filter);
      }
      params.append('limit', '200');

      const response = await api.get(`/logs?${params.toString()}`);
      setLogs(response.data);
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error('Error al cargar logs');
    } finally {
      setLoading(false);
    }
  };

  const loadHandoverAlerts = async () => {
    try {
      const response = await api.get('/logs/handover-alerts/active');
      setHandoverAlerts(response.data);
    } catch (error) {
      console.error('Error loading handover alerts:', error);
    }
  };

  const clearLogs = async () => {
    if (!confirm('¿Estás seguro de que quieres limpiar todos los logs?')) {
      return;
    }

    try {
      await api.delete('/logs');
      setLogs([]);
      toast.success('Logs limpiados exitosamente');
    } catch (error) {
      console.error('Error clearing logs:', error);
      toast.error('Error al limpiar logs');
    }
  };

  const clearHandoverAlerts = async () => {
    if (!confirm('¿Estás seguro de que quieres limpiar todas las alertas de handover?')) {
      return;
    }

    try {
      await api.delete('/logs/handover-alerts');
      setHandoverAlerts([]);
      toast.success('Alertas de handover limpiadas exitosamente');
    } catch (error) {
      console.error('Error clearing handover alerts:', error);
      toast.error('Error al limpiar alertas de handover');
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warn': return 'text-yellow-600 bg-yellow-50';
      case 'debug': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#064A6F] mx-auto mb-4"></div>
          <p className="text-[#064A6F] font-medium">Cargando logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#064A6F] mb-2">Sistema de Monitoreo</h1>
        <p className="text-gray-600">Monitorea logs del sistema y alertas de handover en tiempo real</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'logs'
                  ? 'border-[#A7CF3B] text-[#064A6F]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Logs del Sistema
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`py-2 px-1 border-b-2 font-medium text-sm relative ${
                activeTab === 'alerts'
                  ? 'border-[#A7CF3B] text-[#064A6F]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Alertas de Handover
              {handoverAlerts.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {handoverAlerts.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'logs' ? (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filtrar por nivel
                  </label>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A7CF3B]"
                  >
                    <option value="all">Todos</option>
                    <option value="error">Errores</option>
                    <option value="warn">Advertencias</option>
                    <option value="log">Info</option>
                    <option value="debug">Debug</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoRefresh"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="h-4 w-4 text-[#A7CF3B] focus:ring-[#A7CF3B] border-gray-300 rounded"
                  />
                  <label htmlFor="autoRefresh" className="ml-2 text-sm font-medium text-gray-700">
                    Auto-refresh (5s)
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={loadLogs}
                  disabled={autoRefresh}
                  className="px-4 py-2 bg-[#A7CF3B] hover:bg-[#96BF2D] disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200"
                >
                  {autoRefresh ? 'Auto-refresh activo' : 'Refrescar'}
                </button>
                <button
                  onClick={clearLogs}
                  className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 font-medium rounded-lg transition-colors duration-200"
                >
                  Limpiar Logs
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                Logs del Sistema ({logs.length})
              </h2>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No hay logs disponibles
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {logs.map((log, index) => (
                    <div key={index} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(log.level)}`}>
                              {log.level.toUpperCase()}
                            </span>
                            {log.context && (
                              <span className="text-sm text-gray-500">
                                [{log.context}]
                              </span>
                            )}
                            <span className="text-sm text-gray-400">
                              {formatTimestamp(log.timestamp)}
                            </span>
                          </div>
                          <p className="text-gray-800 whitespace-pre-wrap break-words">
                            {log.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              Alertas de Handover ({handoverAlerts.length})
            </h2>
            <button
              onClick={clearHandoverAlerts}
              className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 font-medium rounded-lg transition-colors duration-200"
            >
              Limpiar Alertas
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {handoverAlerts.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No hay alertas de handover activas
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {handoverAlerts.map((alert, index) => (
                  <div key={index} className="p-4 hover:bg-gray-50 border-l-4 border-red-400">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            HANDOVER
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {alert.leadName || 'Lead'} ({alert.leadPhone})
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 mb-1">{alert.message}</p>
                        <p className="text-xs text-gray-500">{formatTimestamp(alert.timestamp)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}