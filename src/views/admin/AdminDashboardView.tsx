import React, { useEffect } from 'react';
import { useAppStore } from '../../store/AppContext';
import { useAdmin } from '../../hooks/useAdmin';
import { Users, Activity, Cpu, Loader2 } from 'lucide-react';

export function AdminDashboardView() {
  const { state } = useAppStore();
  const { stats, loading, fetchStats } = useAdmin(state.adminApiKey);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const cards = [
    {
      label: 'Total de Clientes',
      value: stats?.totalTenants ?? 0,
      icon: Users,
      color: 'text-indigo-400',
      bg: 'bg-indigo-600/10',
    },
    {
      label: 'Clientes Ativos',
      value: stats?.activeTenants ?? 0,
      icon: Users,
      color: 'text-emerald-400',
      bg: 'bg-emerald-600/10',
    },
    {
      label: 'Uso IA Hoje',
      value: stats?.usageToday ?? 0,
      icon: Activity,
      color: 'text-amber-400',
      bg: 'bg-amber-600/10',
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-display font-bold text-slate-200 mb-2">Dashboard</h1>
      <p className="text-sm text-slate-400 mb-8">Visão geral da plataforma SaaS.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-400">{card.label}</span>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-200">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-bold text-slate-200">Uso por Provedor</h2>
        </div>
        {stats?.usageByProvider && stats.usageByProvider.length > 0 ? (
          <div className="space-y-3">
            {stats.usageByProvider.map((item) => (
              <div key={item.provider} className="flex items-center justify-between">
                <span className="text-sm text-slate-300 capitalize">{item.provider}</span>
                <span className="text-sm font-bold text-amber-400">{item.count} chamadas</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Nenhum uso registrado ainda.</p>
        )}
      </div>
    </div>
  );
}
