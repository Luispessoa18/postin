import React, { useEffect } from 'react';
import { useAppStore } from '../../store/AppContext';
import { useAdmin } from '../../hooks/useAdmin';
import { Loader2 } from 'lucide-react';

export function UsageView() {
  const { state } = useAppStore();
  const { usageLogs, loading, fetchUsage } = useAdmin(state.adminApiKey);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-display font-bold text-slate-200 mb-2">Uso e Logs</h1>
      <p className="text-sm text-slate-400 mb-8">Histórico de chamadas de IA na plataforma.</p>

      {loading && usageLogs.length === 0 ? (
        <div className="flex justify-center p-16">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-widest px-6 py-4">Operação</th>
                <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-widest px-6 py-4">Provedor</th>
                <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-widest px-6 py-4">Modelo</th>
                <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-widest px-6 py-4">Tenant</th>
                <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-widest px-6 py-4">Data</th>
              </tr>
            </thead>
            <tbody>
              {usageLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-sm">
                    Nenhum log de uso registrado.
                  </td>
                </tr>
              ) : (
                usageLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="px-6 py-4 text-sm text-slate-200 font-mono">{log.operation}</td>
                    <td className="px-6 py-4 text-sm text-slate-300 capitalize">{log.provider}</td>
                    <td className="px-6 py-4 text-sm text-slate-400 font-mono">{log.model}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-mono">{log.tenant_id || '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
