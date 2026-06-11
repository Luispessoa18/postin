import React from 'react';
import { useAppStore } from '../store/AppContext';
import { ViewState } from '../types';
import { 
  LayoutDashboard, 
  Settings, 
  CalendarDays, 
  Target, 
  CheckSquare, 
  Palette, 
  Sparkles,
  Shield
} from 'lucide-react';
import { cn } from '../lib/utils';

export function Sidebar() {
  const { state, setViewState, setAppMode } = useAppStore();

  const navItems: { id: ViewState; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Painel Executivo', icon: LayoutDashboard },
    { id: 'onboarding', label: 'Configuração IA', icon: Sparkles },
    { id: 'strategy', label: 'Estratégia', icon: Target },
    { id: 'calendar', label: 'Calendário', icon: CalendarDays },
    { id: 'approvals', label: 'Aprovações', icon: CheckSquare },
    { id: 'brand_library', label: 'Biblioteca de Marca', icon: Palette },
    { id: 'image_generator', label: 'Gerador de Imagem', icon: Sparkles },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className="w-60 border-r border-slate-800 flex flex-col p-6 flex-shrink-0 bg-transparent">
      <div className="flex items-center gap-2 mb-10">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white">M</div>
        <span className="font-bold text-lg tracking-tight text-white">MARKETING AI<span className="text-indigo-500 underline decoration-2 underline-offset-4 font-black">OS</span></span>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = state.currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setViewState(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors text-left",
                isActive 
                  ? "bg-indigo-600/10 text-indigo-400" 
                  : "text-slate-400 hover:text-white"
              )}
            >
              <div className="w-4 h-4 flex items-center justify-center shrink-0">
                {isActive ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
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
          <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-2">Status da IA</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs font-medium text-emerald-500">Sistemas Operacionais</span>
          </div>
        </div>

        <button
          onClick={() => setAppMode('admin')}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-slate-500 hover:text-amber-400 hover:bg-amber-600/5 transition-colors"
        >
          <Shield className="w-4 h-4" />
          Admin Panel
        </button>
      </div>
    </aside>
  );
}
