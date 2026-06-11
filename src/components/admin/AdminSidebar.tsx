import React from 'react';
import { useAppStore } from '../../store/AppContext';
import { AdminViewState } from '../../types';
import {
  LayoutDashboard,
  Users,
  Cpu,
  Activity,
  ArrowLeft,
  CreditCard,
  Plug,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export function AdminSidebar() {
  const { state, setAdminView, logoutAdmin } = useAppStore();

  const navItems: { id: AdminViewState; label: string; icon: React.ElementType }[] = [
    { id: 'admin_dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'admin_tenants', label: 'Clientes', icon: Users },
    { id: 'admin_platform_ai', label: 'Config IA Global', icon: Cpu },
    { id: 'admin_integrations', label: 'Integrações', icon: Plug },
    { id: 'admin_usage', label: 'Uso e Logs', icon: Activity },
  ];

  return (
    <aside className="w-60 border-r border-slate-800 flex flex-col p-6 flex-shrink-0 bg-transparent">
      <div className="flex items-center gap-2 mb-10">
        <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center font-bold text-white">A</div>
        <span className="font-bold text-lg tracking-tight text-white">
          ADMIN<span className="text-amber-500 underline decoration-2 underline-offset-4 font-black">PANEL</span>
        </span>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = state.adminView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setAdminView(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors text-left',
                isActive
                  ? 'bg-amber-600/10 text-amber-400'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              <div className="w-4 h-4 flex items-center justify-center shrink-0">
                {isActive ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                ) : (
                  <item.icon className="w-4 h-4" />
                )}
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-4 h-4 text-slate-500" />
            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Planos</p>
          </div>
          <p className="text-xs text-slate-400">Billing em breve</p>
        </div>

        <button
          onClick={logoutAdmin}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Sair e Voltar ao App
        </button>
      </div>
    </aside>
  );
}
