import React from 'react';
import { useAppStore } from '../store/AppContext';
import { Sidebar } from './Sidebar';
import { DashboardView } from '../views/DashboardView';
import { OnboardingView } from '../views/OnboardingView';
import { StrategyView } from '../views/StrategyView';
import { CalendarView } from '../views/CalendarView';
import { ApprovalsView } from '../views/ApprovalsView';
import { BrandLibraryView } from '../views/BrandLibraryView';
import { ImageGeneratorView } from '../views/ImageGeneratorView';
import { SettingsView } from '../views/SettingsView';

export function MainLayout() {
  const { state } = useAppStore();

  const renderView = () => {
    switch (state.currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'onboarding':
        return <OnboardingView />;
      case 'strategy':
        return <StrategyView />;
      case 'calendar':
        return <CalendarView />;
      case 'approvals':
        return <ApprovalsView />;
      case 'brand_library':
        return <BrandLibraryView />;
      case 'image_generator':
        return <ImageGeneratorView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-h-0 bg-slate-950">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/80 backdrop-blur-md flex-shrink-0 z-10">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-slate-800 shadow-sm cursor-pointer hover:border-slate-700 transition-colors">
              <div className="w-5 h-5 bg-indigo-500 rounded-lg flex items-center justify-center text-[10px] text-white font-bold shadow-[0_0_10px_rgba(99,102,241,0.3)]">
                {state.brand ? state.brand.name.charAt(0).toUpperCase() : 'M'}
              </div>
              <span className="text-sm font-bold text-slate-200">{state.brand ? state.brand.name : 'Configuração necessária'}</span>
              <div className="text-slate-500 text-[10px] flex justify-center items-center ml-1">▼</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-px bg-slate-800 mx-2"></div>
            <div className="text-xs text-right">
              <p className="font-bold text-slate-200">Usuário</p>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-0.5">Plano {state.plan}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-slate-700 overflow-hidden cursor-pointer">
               <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix" alt="avatar" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto relative">
          <div className="max-w-7xl mx-auto w-full">
            {renderView()}
          </div>
        </div>
      </main>
    </div>
  );
}
