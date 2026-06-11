import React, { useState } from 'react';
import { useAppStore } from '../../store/AppContext';
import { Facebook, Instagram, RefreshCw, Loader2, Save } from 'lucide-react';
import { LibraryItem } from '../../types';
import { normalizePosts, refreshPostsFromMeta, buildBrandLibrary, migrateLibraryItem } from '../../lib/social';
import { migrateBrandColors } from '../../lib/brandColors';
import { ContentLibraryStep } from '../onboarding/ContentLibraryStep';
import { BrandColorsEditor } from '../BrandColorsEditor';
import { LogoUploadField } from '../LogoUploadField';

export function CompanySettingsTab() {
  const { state, setBrand, setProfiles, setOnboardingStage, setViewState, connectMetaOAuth } = useAppStore();
  const brand = state.brand;
  const [selectedProfileId, setSelectedProfileId] = useState(state.socialProfiles[0]?.id || '');
  const [contentLibrary, setContentLibrary] = useState<LibraryItem[]>(
    normalizePosts(
      brand?.contentLibrary?.length
        ? brand.contentLibrary.map(migrateLibraryItem)
        : brand?.productPhotos?.map((url, i) => ({ id: `p-${i}`, imageUrl: url, kind: 'product' as const }))
    )
  );
  const [colors, setColors] = useState<string[]>(migrateBrandColors(brand?.colors));
  const [form, setForm] = useState({
    name: brand?.name || '',
    segment: brand?.segment || '',
    about: brand?.about || '',
    city: brand?.city || '',
    website: brand?.website || '',
    logoUrl: brand?.logoUrl || '',
    logoUrlTransparent: brand?.logoUrlTransparent || '',
    logoUrlLight: brand?.logoUrlLight || '',
    logoUrlDark: brand?.logoUrlDark || '',
  });
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const selectedProfile = state.socialProfiles.find(p => p.id === selectedProfileId);

  const connectNetworks = () => connectMetaOAuth();

  const handleSave = () => {
    if (!brand) return;
    setSaving(true);
    const library = buildBrandLibrary(contentLibrary);
    setBrand({
      ...brand,
      name: form.name,
      segment: form.segment,
      about: form.about,
      city: form.city,
      website: form.website,
      logoUrl: form.logoUrl,
      logoUrlTransparent: form.logoUrlTransparent,
      logoUrlLight: form.logoUrlLight,
      logoUrlDark: form.logoUrlDark,
      colors,
      contentLibrary: library.contentLibrary,
      productPhotos: library.productPhotos,
    });
    if (selectedProfile) setProfiles([selectedProfile]);
    setSaving(false);
  };

  const handleRefreshPosts = async () => {
    if (!selectedProfile) return;
    setRefreshing(true);
    try {
      const posts = await refreshPostsFromMeta(selectedProfile);
      const products = contentLibrary.filter(i => i.kind === 'product');
      setContentLibrary([...posts, ...products]);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setRefreshing(false);
    }
  };

  if (!brand) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 mb-4">Complete o onboarding para configurar sua empresa.</p>
        <button onClick={() => { setOnboardingStage(0); setViewState('onboarding'); }} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold">
          Iniciar configuração
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-slate-200 mb-4">Conexão Meta</h2>
        <div className="flex flex-wrap gap-3 mb-4">
          <button onClick={connectNetworks} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold text-sm">
            <Facebook className="w-4 h-4" /> Reconectar Facebook/Instagram
          </button>
          <button onClick={handleRefreshPosts} disabled={refreshing || !selectedProfile?.instagram} className="flex items-center gap-2 border border-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm disabled:opacity-50">
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Atualizar posts da Meta
          </button>
        </div>

        {state.socialProfiles.length > 0 && (
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">Página conectada</label>
            <select
              value={selectedProfileId}
              onChange={(e) => {
                setSelectedProfileId(e.target.value);
                const p = state.socialProfiles.find(x => x.id === e.target.value);
                if (p) {
                  setForm(f => ({
                    ...f,
                    name: p.name,
                    about: p.about || p.instagram?.biography || f.about,
                    segment: p.category || f.segment,
                    logoUrl: p.facebook?.pictureUrl || p.instagram?.pictureUrl || f.logoUrl,
                  }));
                  const products = contentLibrary.filter(i => i.kind === 'product');
                  setContentLibrary([...normalizePosts(p.instagram?.recentPosts).map(i => ({ ...i, kind: 'post' as const })), ...products]);
                }
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200"
            >
              {state.socialProfiles.map(p => (
                <option key={p.id} value={p.id}>{p.name} {p.instagram?.handle && `(${p.instagram.handle})`}</option>
              ))}
            </select>
            {selectedProfile?.instagram && (
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <Instagram className="w-3 h-3" /> {selectedProfile.instagram.followers.toLocaleString()} seguidores
              </p>
            )}
          </div>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-200">Dados da empresa</h2>
          <button
            onClick={() => { setOnboardingStage(2); setViewState('onboarding'); }}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300"
          >
            Editar no assistente →
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-bold text-slate-300 mb-2">Nome</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200" />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="block text-sm font-bold text-slate-300 mb-2">Segmento</label>
            <input value={form.segment} onChange={e => setForm({ ...form, segment: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-bold text-slate-300 mb-2">Sobre</label>
            <textarea value={form.about} onChange={e => setForm({ ...form, about: e.target.value })} rows={3} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200" />
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-slate-200 mb-4">Logo</h2>
        <div className="flex flex-wrap gap-6">
          <LogoUploadField
            label="Logo principal"
            value={form.logoUrl}
            tenantId={state.tenantId}
            category="logo"
            onChange={(url) => setForm({ ...form, logoUrl: url })}
          />
          <LogoUploadField
            label="Sem fundo"
            hint="PNG transparente"
            value={form.logoUrlTransparent}
            tenantId={state.tenantId}
            category="logo_transparent"
            onChange={(url) => setForm({ ...form, logoUrlTransparent: url })}
          />
          <LogoUploadField
            label="Versão clara"
            hint="Para fundos escuros"
            value={form.logoUrlLight}
            tenantId={state.tenantId}
            category="logo_light"
            onChange={(url) => setForm({ ...form, logoUrlLight: url })}
            previewClassName="bg-slate-700"
          />
          <LogoUploadField
            label="Versão escura"
            hint="Para fundos claros"
            value={form.logoUrlDark}
            tenantId={state.tenantId}
            category="logo_dark"
            onChange={(url) => setForm({ ...form, logoUrlDark: url })}
            previewClassName="bg-slate-200"
          />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-slate-200 mb-4">Cores da marca</h2>
        <BrandColorsEditor colors={colors} onChange={setColors} />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <ContentLibraryStep
          profile={selectedProfile}
          posts={contentLibrary}
          onChange={setContentLibrary}
          tenantId={state.tenantId}
          showContinue={false}
        />
      </div>

      <button onClick={handleSave} disabled={saving} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Salvar configurações da empresa
      </button>
    </div>
  );
}
