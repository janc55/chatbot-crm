import { useState, useEffect } from 'react';
import api from './api';
import toast from 'react-hot-toast';

interface LogEntry {
  timestamp: string;
  level: 'log' | 'error' | 'warn' | 'debug';
  message: string;
  context?: string;
}

export default function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'error' | 'warn' | 'log' | 'debug'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadLogs();

    if (autoRefresh) {
      const interval = setInterval(loadLogs, 5000); // Refresh every 5 seconds
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
        <h1 className="text-3xl font-bold text-[#064A6F] mb-2">Logs del Sistema</h1>
        <p className="text-gray-600">Monitorea la actividad y errores del chatbot en tiempo real</p>
      </div>

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
            Logs ({logs.length})
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
    </div>
  );
}