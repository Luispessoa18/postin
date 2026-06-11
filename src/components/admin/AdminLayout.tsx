import React from 'react';
import { useAppStore } from '../../store/AppContext';
import { AdminSidebar } from './AdminSidebar';
import { AdminDashboardView } from '../../views/admin/AdminDashboardView';
import { TenantsView } from '../../views/admin/TenantsView';
import { PlatformAIView } from '../../views/admin/PlatformAIView';
import { UsageView } from '../../views/admin/UsageView';
import { IntegrationsView } from '../../views/admin/IntegrationsView';

export function AdminLayout() {
  const { state } = useAppStore();

  const renderView = () => {
    switch (state.adminView) {
      case 'admin_dashboard':
        return <AdminDashboardView />;
      case 'admin_tenants':
        return <TenantsView />;
      case 'admin_platform_ai':
        return <PlatformAIView />;
      case 'admin_integrations':
        return <IntegrationsView />;
      case 'admin_usage':
        return <UsageView />;
      default:
        return <AdminDashboardView />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 font-sans overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 flex flex-col min-h-0 bg-slate-950">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/80 backdrop-blur-md flex-shrink-0 z-10">
          <div className="flex items-center gap-4">
            <div className="bg-amber-600/10 px-3 py-1.5 rounded-lg flex items-center gap-2 border border-amber-600/30">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-sm font-bold text-amber-400">Super Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-px bg-slate-800 mx-2" />
            <div className="text-xs text-right">
              <p className="font-bold text-slate-200">{state.adminUsername || 'Admin'}</p>
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mt-0.5">Super Admin</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-amber-600/20 border-2 border-amber-600/40 overflow-hidden flex items-center justify-center">
              <span className="text-amber-400 font-bold text-sm">A</span>
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
