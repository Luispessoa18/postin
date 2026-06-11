import { useState, useEffect, useCallback } from 'react';
import type { AISettings, AvailableModels, AIProvider } from '../types';

const DEFAULT_SETTINGS: AISettings = {
  tenantId: 'tenant_demo',
  usePlatformKeys: true,
  geminiApiKey: '',
  openaiApiKey: '',
  hasGeminiKey: false,
  hasOpenaiKey: false,
  textProvider: 'gemini',
  textModel: 'gemini-2.5-flash',
  imageProvider: 'gemini',
  imageModel: 'gemini-2.5-flash-image',
};

export function useAISettings(tenantId: string) {
  const [settings, setSettings] = useState<AISettings>({ ...DEFAULT_SETTINGS, tenantId });
  const [availableModels, setAvailableModels] = useState<AvailableModels | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/settings/ai?tenantId=${tenantId}`);
      if (!res.ok) throw new Error('Falha ao carregar configurações');
      const data = await res.json();
      setSettings({
        tenantId: data.tenantId,
        usePlatformKeys: data.usePlatformKeys,
        geminiApiKey: data.geminiApiKey || '',
        openaiApiKey: data.openaiApiKey || '',
        hasGeminiKey: data.hasGeminiKey,
        hasOpenaiKey: data.hasOpenaiKey,
        textProvider: data.textProvider,
        textModel: data.textModel,
        imageProvider: data.imageProvider,
        imageModel: data.imageModel,
      });
      if (data.availableModels) setAvailableModels(data.availableModels);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateField = <K extends keyof AISettings>(key: K, value: AISettings[K]) => {
    setSettings((s) => ({ ...s, [key]: value }));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch('/api/settings/ai', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          usePlatformKeys: settings.usePlatformKeys,
          geminiApiKey: settings.geminiApiKey,
          openaiApiKey: settings.openaiApiKey,
          textProvider: settings.textProvider,
          textModel: settings.textModel,
          imageProvider: settings.imageProvider,
          imageModel: settings.imageModel,
        }),
      });
      if (!res.ok) throw new Error('Falha ao salvar configurações');
      setSaved(true);
      await fetchSettings();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const getModelsForProvider = (task: 'text' | 'image', provider: AIProvider) => {
    if (!availableModels) return [];
    return availableModels[task][provider] || [];
  };

  return {
    settings,
    availableModels,
    loading,
    saving,
    error,
    saved,
    updateField,
    save,
    getModelsForProvider,
    refetch: fetchSettings,
  };
}
