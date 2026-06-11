import { useState, useEffect, useCallback } from 'react';
import type { Tenant, AdminStats, UsageLog, AvailableModels, AIProvider } from '../types';

function adminHeaders(adminApiKey: string): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (adminApiKey) headers['X-Admin-Key'] = adminApiKey;
  return headers;
}

async function parseJsonResponse(res: Response): Promise<any> {
  const text = await res.text();
  if (!text.trim()) {
    if (!res.ok) {
      throw new Error(`Erro ${res.status}: resposta vazia do servidor. Verifique se o backend está rodando (npm run dev).`);
    }
    return {};
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Resposta inválida do servidor (não é JSON).');
  }
}

export function useAdmin(adminApiKey: string) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [platformAI, setPlatformAI] = useState({
    geminiApiKey: '',
    openaiApiKey: '',
    hasGeminiKey: false,
    hasOpenaiKey: false,
    textProvider: 'gemini' as AIProvider,
    textModel: 'gemini-2.5-flash',
    imageProvider: 'gemini' as AIProvider,
    imageModel: 'gemini-2.5-flash-image',
  });
  const [availableModels, setAvailableModels] = useState<AvailableModels | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headers = useCallback(() => adminHeaders(adminApiKey), [adminApiKey]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stats', { headers: headers() });
      if (!res.ok) throw new Error('Falha ao carregar estatísticas');
      setStats(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [headers]);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/tenants', { headers: headers() });
      if (!res.ok) throw new Error('Falha ao carregar clientes');
      setTenants(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [headers]);

  const fetchUsage = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/usage?limit=100', { headers: headers() });
      if (!res.ok) throw new Error('Falha ao carregar logs');
      setUsageLogs(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [headers]);

  const fetchPlatformAI = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/platform/ai', { headers: headers() });
      if (!res.ok) throw new Error('Falha ao carregar config IA');
      const data = await res.json();
      setPlatformAI({
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
  }, [headers]);

  const createTenant = async (data: { name: string; plan?: string; status?: string }) => {
    const res = await fetch('/api/admin/tenants', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Falha ao criar cliente');
    await fetchTenants();
    return res.json();
  };

  const updateTenant = async (id: string, data: Partial<Tenant>) => {
    const res = await fetch(`/api/admin/tenants/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Falha ao atualizar cliente');
    await fetchTenants();
    return res.json();
  };

  const deleteTenant = async (id: string) => {
    const res = await fetch(`/api/admin/tenants/${id}`, {
      method: 'DELETE',
      headers: headers(),
    });
    if (!res.ok) throw new Error('Falha ao excluir cliente');
    await fetchTenants();
  };

  const savePlatformAI = async (data: typeof platformAI) => {
    const res = await fetch('/api/admin/platform/ai', {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({
        geminiApiKey: data.geminiApiKey,
        openaiApiKey: data.openaiApiKey,
        textProvider: data.textProvider,
        textModel: data.textModel,
        imageProvider: data.imageProvider,
        imageModel: data.imageModel,
      }),
    });
    if (!res.ok) throw new Error('Falha ao salvar config IA');
    await fetchPlatformAI();
  };

  const [integrations, setIntegrations] = useState<any>(null);

  const fetchIntegrations = useCallback(async () => {
    const res = await fetch('/api/admin/integrations', { headers: headers() });
    if (!res.ok) throw new Error('Falha ao carregar integrações');
    const data = await res.json();
    setIntegrations(data);
    return data;
  }, [headers]);

  const saveIntegrations = async (data: { facebookAppId: string; facebookAppSecret: string; appUrl: string }) => {
    const res = await fetch('/api/admin/integrations', {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Falha ao salvar integrações');
  };

  const startTunnel = async () => {
    const res = await fetch('/api/admin/integrations/tunnel/start', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({}),
    });
    const data = await parseJsonResponse(res);
    if (!res.ok) throw new Error(data.error || `Falha ao iniciar tunnel (${res.status})`);
    return data;
  };

  const stopTunnel = async () => {
    const res = await fetch('/api/admin/integrations/tunnel/stop', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      const data = await parseJsonResponse(res);
      throw new Error(data.error || 'Falha ao parar tunnel');
    }
  };

  const fetchTunnelStatus = useCallback(async () => {
    const res = await fetch('/api/admin/integrations/tunnel/status', { headers: headers() });
    if (!res.ok) return { running: false, url: '', oauthRedirectUri: '' };
    return parseJsonResponse(res);
  }, [headers]);

  return {
    stats,
    tenants,
    usageLogs,
    platformAI,
    setPlatformAI,
    availableModels,
    loading,
    error,
    fetchStats,
    fetchTenants,
    fetchUsage,
    fetchPlatformAI,
    createTenant,
    updateTenant,
    deleteTenant,
    savePlatformAI,
    integrations,
    fetchIntegrations,
    saveIntegrations,
    startTunnel,
    stopTunnel,
    fetchTunnelStatus,
  };
}
