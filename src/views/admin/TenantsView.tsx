import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/AppContext';
import { useAdmin } from '../../hooks/useAdmin';
import { Plus, Pencil, Trash2, Loader2, X } from 'lucide-react';
import type { Tenant } from '../../types';

export function TenantsView() {
  const { state } = useAppStore();
  const { tenants, loading, fetchTenants, createTenant, updateTenant, deleteTenant } = useAdmin(state.adminApiKey);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [form, setForm] = useState({ name: '', plan: 'pro', status: 'active' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', plan: 'pro', status: 'active' });
    setModalOpen(true);
  };

  const openEdit = (tenant: Tenant) => {
    setEditing(tenant);
    setForm({ name: tenant.name, plan: tenant.plan, status: tenant.status });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateTenant(editing.id, form as Partial<Tenant>);
      } else {
        await createTenant(form);
      }
      setModalOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (id === 'tenant_demo') return;
    if (!confirm('Excluir este cliente?')) return;
    await deleteTenant(id);
  };

  const planBadge = (plan: string) => {
    const colors: Record<string, string> = {
      basic: 'bg-slate-700 text-slate-300',
      pro: 'bg-indigo-600/20 text-indigo-400',
      agency: 'bg-amber-600/20 text-amber-400',
    };
    return colors[plan] || colors.basic;
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'text-emerald-400',
      suspended: 'text-red-400',
      trial: 'text-amber-400',
    };
    return colors[status] || 'text-slate-400';
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-200 mb-2">Clientes</h1>
          <p className="text-sm text-slate-400">Gerencie tenants da plataforma.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-4 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </button>
      </div>

      {loading && tenants.length === 0 ? (
        <div className="flex justify-center p-16">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-widest px-6 py-4">Nome</th>
                <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-widest px-6 py-4">Plano</th>
                <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-widest px-6 py-4">Status</th>
                <th className="text-left text-xs font-bold text-slate-500 uppercase tracking-widest px-6 py-4">Criado em</th>
                <th className="text-right text-xs font-bold text-slate-500 uppercase tracking-widest px-6 py-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-200">{tenant.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{tenant.id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${planBadge(tenant.plan)}`}>
                      {tenant.plan}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm font-medium capitalize ${statusBadge(tenant.status)}`}>
                    {tenant.status}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {new Date(tenant.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(tenant)} className="p-2 text-slate-400 hover:text-indigo-400 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      {tenant.id !== 'tenant_demo' && (
                        <button onClick={() => handleDelete(tenant.id)} className="p-2 text-slate-400 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-200">
                {editing ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Nome</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Plano</label>
                <select
                  value={form.plan}
                  onChange={(e) => setForm({ ...form, plan: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                  <option value="agency">Agency</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="active">Ativo</option>
                  <option value="trial">Trial</option>
                  <option value="suspended">Suspenso</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-colors disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
