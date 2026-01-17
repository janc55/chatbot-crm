import { useState, useEffect } from 'react';
import api from './api';
import toast from 'react-hot-toast';

interface ChatbotSettings {
  messageDelayEnabled: boolean;
  messageDelayMin: number;
  messageDelayMax: number;
  typingSpeed: number;
  autoResponsesEnabled: boolean;
  workingHoursEnabled: boolean;
  workingHoursStart: string;
  workingHoursEnd: string;
  customGreeting: string;
  aiConfidenceThreshold: number;
  messageGroupingEnabled: boolean;
  messageGroupingTimeout: number;
}

export default function Settings() {
  const [settings, setSettings] = useState<ChatbotSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/settings/chatbot');
      setSettings(response.data);
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Error al cargar configuraciones');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      await api.post('/settings/chatbot', settings);
      toast.success('Configuraciones guardadas exitosamente');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error al guardar configuraciones');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (!confirm('¿Estás seguro de que quieres restaurar los valores por defecto? Se perderán los cambios actuales.')) {
      return;
    }

    setSaving(true);
    try {
      await api.post('/settings/initialize');
      // Recargar settings
      await loadSettings();
      toast.success('Configuraciones restauradas a valores por defecto');
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast.error('Error al restaurar configuraciones');
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof ChatbotSettings>(key: K, value: ChatbotSettings[K]) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#064A6F] mx-auto mb-4"></div>
          <p className="text-[#064A6F] font-medium">Cargando configuraciones...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Error al cargar configuraciones</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#064A6F] mb-2">Configuraciones del Chatbot</h1>
        <p className="text-gray-600">Personaliza el comportamiento y apariencia de tu asistente virtual</p>
      </div>

      <div className="space-y-8">
        {/* Message Delays */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Simulación de Escritura</h2>
          <p className="text-gray-600 mb-4">Hace que el bot parezca más humano al agregar delays realistas antes de enviar mensajes</p>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="messageDelayEnabled"
                checked={settings.messageDelayEnabled}
                onChange={(e) => updateSetting('messageDelayEnabled', e.target.checked)}
                className="h-4 w-4 text-[#A7CF3B] focus:ring-[#A7CF3B] border-gray-300 rounded"
              />
              <label htmlFor="messageDelayEnabled" className="ml-2 text-sm font-medium text-gray-700">
                Habilitar delays en mensajes
              </label>
            </div>

            {settings.messageDelayEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delay Mínimo (ms)
                  </label>
                  <input
                    type="number"
                    value={settings.messageDelayMin}
                    onChange={(e) => updateSetting('messageDelayMin', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A7CF3B]"
                    min="0"
                    max="5000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tiempo base mínimo antes de enviar</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Delay Máximo (ms)
                  </label>
                  <input
                    type="number"
                    value={settings.messageDelayMax}
                    onChange={(e) => updateSetting('messageDelayMax', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A7CF3B]"
                    min="0"
                    max="5000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Tiempo base máximo antes de enviar</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Velocidad de Escritura (chars/seg)
                  </label>
                  <input
                    type="number"
                    value={settings.typingSpeed}
                    onChange={(e) => updateSetting('typingSpeed', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A7CF3B]"
                    min="50"
                    max="500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Bonus de delay por longitud (más alto = menos bonus)</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Message Grouping */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Agrupación de Mensajes (Ráfagas)</h2>
          <p className="text-gray-600 mb-4">Permite que el bot espere unos segundos para consolidar múltiples mensajes enviados consecutivamente por el usuario</p>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="messageGroupingEnabled"
                checked={settings.messageGroupingEnabled}
                onChange={(e) => updateSetting('messageGroupingEnabled', e.target.checked)}
                className="h-4 w-4 text-[#A7CF3B] focus:ring-[#A7CF3B] border-gray-300 rounded"
              />
              <label htmlFor="messageGroupingEnabled" className="ml-2 text-sm font-medium text-gray-700">
                Habilitar agrupación de mensajes
              </label>
            </div>

            {settings.messageGroupingEnabled && (
              <div className="ml-6 max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiempo de espera (ms)
                </label>
                <input
                  type="number"
                  value={settings.messageGroupingTimeout}
                  onChange={(e) => updateSetting('messageGroupingTimeout', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A7CF3B]"
                  min="500"
                  max="10000"
                  step="500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tiempo que el bot espera tras el último mensaje antes de procesar la ráfaga
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Auto Responses */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Respuestas Automáticas</h2>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoResponsesEnabled"
                checked={settings.autoResponsesEnabled}
                onChange={(e) => updateSetting('autoResponsesEnabled', e.target.checked)}
                className="h-4 w-4 text-[#A7CF3B] focus:ring-[#A7CF3B] border-gray-300 rounded"
              />
              <label htmlFor="autoResponsesEnabled" className="ml-2 text-sm font-medium text-gray-700">
                Habilitar respuestas automáticas
              </label>
            </div>
          </div>
        </div>

        {/* Working Hours */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Horario de Trabajo</h2>
          <p className="text-gray-600 mb-4">Restringe las respuestas automáticas a ciertos horarios</p>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="workingHoursEnabled"
                checked={settings.workingHoursEnabled}
                onChange={(e) => updateSetting('workingHoursEnabled', e.target.checked)}
                className="h-4 w-4 text-[#A7CF3B] focus:ring-[#A7CF3B] border-gray-300 rounded"
              />
              <label htmlFor="workingHoursEnabled" className="ml-2 text-sm font-medium text-gray-700">
                Habilitar restricción de horario
              </label>
            </div>

            {settings.workingHoursEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora de Inicio
                  </label>
                  <input
                    type="time"
                    value={settings.workingHoursStart}
                    onChange={(e) => updateSetting('workingHoursStart', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A7CF3B]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora de Fin
                  </label>
                  <input
                    type="time"
                    value={settings.workingHoursEnd}
                    onChange={(e) => updateSetting('workingHoursEnd', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A7CF3B]"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Custom Greeting */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Mensaje de Bienvenida</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensaje personalizado de saludo
            </label>
            <textarea
              value={settings.customGreeting}
              onChange={(e) => updateSetting('customGreeting', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A7CF3B]"
              placeholder="¡Hola! Soy el asistente de la Universidad..."
            />
          </div>
        </div>

        {/* AI Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Configuración de IA</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Umbral de Confianza de IA (0-1)
            </label>
            <input
              type="number"
              value={settings.aiConfidenceThreshold}
              onChange={(e) => updateSetting('aiConfidenceThreshold', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#A7CF3B]"
              min="0"
              max="1"
              step="0.1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Valores más altos hacen que la IA sea más conservadora al responder
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={resetToDefaults}
            disabled={saving}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
          >
            Restaurar Valores por Defecto
          </button>
          <button
            onClick={saveSettings}
            disabled={saving}
            className="bg-[#A7CF3B] hover:bg-[#96BF2D] disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              'Guardar Configuraciones'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}