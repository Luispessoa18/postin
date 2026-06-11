import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/AppContext';
import { useAdmin } from '../../hooks/useAdmin';
import { Loader2, CheckCircle2, Globe, Copy, Play, Square } from 'lucide-react';

export function IntegrationsView() {
  const { state } = useAppStore();
  const { integrations, fetchIntegrations, saveIntegrations, startTunnel, stopTunnel, fetchTunnelStatus } = useAdmin(state.adminApiKey);
  const [form, setForm] = useState({ facebookAppId: '', facebookAppSecret: '', appUrl: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tunnelLoading, setTunnelLoading] = useState(false);
  const [tunnelStatus, setTunnelStatus] = useState<{ running: boolean; url: string; oauthRedirectUri: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchIntegrations().then((data) => {
      if (data) setForm({
        facebookAppId: data.facebookAppId || '',
        facebookAppSecret: data.facebookAppSecret || '',
        appUrl: data.appUrl || '',
      });
    });
    fetchTunnelStatus().then(setTunnelStatus);
  }, [fetchIntegrations, fetchTunnelStatus]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await saveIntegrations(form);
      setSaved(true);
      await fetchIntegrations();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStartTunnel = async () => {
    setTunnelLoading(true);
    setError(null);
    try {
      const result = await startTunnel();
      setTunnelStatus({ running: true, url: result.url, oauthRedirectUri: result.oauthRedirectUri });
      setForm(f => ({ ...f, appUrl: result.url }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setTunnelLoading(false);
    }
  };

  const handleStopTunnel = async () => {
    await stopTunnel();
    const status = await fetchTunnelStatus();
    setTunnelStatus(status);
  };

  const copyText = (text: string) => navigator.clipboard.writeText(text);

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-display font-bold text-slate-200 mb-2">Integrações</h1>
      <p className="text-sm text-slate-400 mb-8">Configure Meta OAuth e tunnel Cloudflare para testes locais.</p>

      {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}
      {saved && (
        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Configurações salvas.
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-slate-200">Cloudflare Tunnel</h2>
          </div>
          <p className="text-sm text-slate-400 mb-4">Gera URL pública para OAuth Meta em ambiente local. Requer <code className="text-amber-400">cloudflared</code> instalado.</p>

          {tunnelStatus?.url && (
            <div className="mb-4 p-3 bg-slate-950 border border-slate-800 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">URL pública</p>
              <div className="flex items-center gap-2">
                <code className="text-sm text-emerald-400 flex-1 truncate">{tunnelStatus.url}</code>
                <button onClick={() => copyText(tunnelStatus.url)} className="p-2 text-slate-400 hover:text-white"><Copy className="w-4 h-4" /></button>
              </div>
              {tunnelStatus.oauthRedirectUri && (
                <>
                  <p className="text-xs text-slate-500 mt-3 mb-1">Redirect URI OAuth (cole no app Meta)</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-indigo-400 flex-1 break-all">{tunnelStatus.oauthRedirectUri}</code>
                    <button onClick={() => copyText(tunnelStatus.oauthRedirectUri)} className="p-2 text-slate-400 hover:text-white"><Copy className="w-4 h-4" /></button>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleStartTunnel}
              disabled={tunnelLoading || tunnelStatus?.running}
              className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl"
            >
              {tunnelLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Aguardando URL (até 45s)...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Iniciar tunnel
                </>
              )}
            </button>
            {tunnelStatus?.running && (
              <button onClick={handleStopTunnel} className="flex items-center gap-2 border border-slate-700 text-slate-300 py-2.5 px-4 rounded-xl hover:bg-slate-800">
                <Square className="w-4 h-4" /> Parar
              </button>
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-slate-200 mb-4">Meta (Facebook / Instagram)</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">App ID</label>
              <input value={form.facebookAppId} onChange={e => setForm({ ...form, facebookAppId: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 font-mono focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">App Secret</label>
              <input type="password" value={form.facebookAppSecret} onChange={e => setForm({ ...form, facebookAppSecret: e.target.value })} placeholder="Cole o secret do app Meta" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 font-mono focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">URL pública da app</label>
              <input value={form.appUrl} onChange={e => setForm({ ...form, appUrl: e.target.value })} placeholder="https://xxx.trycloudflare.com" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-amber-500" />
              <p className="text-xs text-slate-500 mt-1">Preenchida automaticamente ao iniciar o tunnel.</p>
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Salvar integrações
        </button>
      </div>
    </div>
  );
}
