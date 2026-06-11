import React, { useState, useRef, useCallback } from 'react';
import { useAppStore } from '../store/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { Facebook, Instagram, ArrowRight, ArrowLeft, CheckCircle2, BrainCircuit, RotateCcw, RefreshCw, X } from 'lucide-react';
import { Brand, LibraryItem, AnalysisInsights, SocialProfile } from '../types';
import { ContentLibraryStep } from '../components/onboarding/ContentLibraryStep';
import { LogoUploadField } from '../components/LogoUploadField';
import { ProfileAnalysisStep } from '../components/onboarding/ProfileAnalysisStep';
import { initContentLibraryFromProfile, buildBrandLibrary, normalizePosts, splitLibraryItems, mergeLibraryItems } from '../lib/social';
import { BrandColorsEditor } from '../components/BrandColorsEditor';
import { DEFAULT_COLORS, mergeExtractedColors, migrateBrandColors } from '../lib/brandColors';

const STAGE_LABELS = ['Redes', 'Página', 'Perfil', 'Visual', 'Biblioteca', 'Análise'];
const LAST_STAGE = STAGE_LABELS.length - 1;

function buildFormFromProfile(profile: SocialProfile, prev: Partial<Brand>, replace = false): Partial<Brand> {
  const logo = profile.facebook?.pictureUrl || profile.instagram?.pictureUrl || '';
  if (replace) {
    return {
      name: profile.name || '',
      about: profile.about || profile.instagram?.biography || '',
      segment: profile.category || '',
      logoUrl: logo,
      subSegment: '',
      city: '',
      website: '',
      whatsapp: '',
    };
  }
  return {
    ...prev,
    name: profile.name || prev.name || '',
    about: profile.about || profile.instagram?.biography || prev.about || '',
    segment: profile.category || prev.segment || '',
    logoUrl: logo || prev.logoUrl || '',
  };
}

export function OnboardingView() {
  const { state, setOnboardingStage, setBrand, setProfiles, setInsights, setViewState, connectMetaOAuth } = useAppStore();
  const stage = state.onboardingStage;
  const hydratedRef = useRef(false);
  const lastImportedProfileRef = useRef<string | null>(null);
  const colorsAutoExtractedRef = useRef(false);

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [contentLibrary, setContentLibrary] = useState<LibraryItem[]>([]);
  const [formData, setFormData] = useState<Partial<Brand>>({
    name: '', segment: '', subSegment: '', about: '', city: '', website: '', whatsapp: '', logoUrl: '',
    logoUrlTransparent: '', logoUrlLight: '', logoUrlDark: ''
  });
  const [colors, setColors] = useState<string[]>([...DEFAULT_COLORS]);

  const resolveProfile = useCallback((id?: string | null) => {
    if (!state.socialProfiles.length) return undefined;
    if (id) {
      const found = state.socialProfiles.find(p => p.id === id);
      if (found) return found;
    }
    return state.socialProfiles[0];
  }, [state.socialProfiles]);

  const selectedProfile = resolveProfile(selectedProfileId);

  const importPostsFromProfile = useCallback((profile: SocialProfile, replacePostItems = true) => {
    const imported = initContentLibraryFromProfile(profile);
    if (!imported.length) return;
    setContentLibrary(prev => {
      const { products } = splitLibraryItems(prev);
      if (replacePostItems) {
        return mergeLibraryItems(imported, products);
      }
      const { posts: existingPosts } = splitLibraryItems(prev);
      if (existingPosts.length) return prev;
      return mergeLibraryItems(imported, products);
    });
  }, []);

  const importAllFromProfile = useCallback((profile: SocialProfile, opts?: { replaceForm?: boolean; reloadPosts?: boolean }) => {
    const replaceForm = opts?.replaceForm ?? false;
    const reloadPosts = opts?.reloadPosts ?? true;
    lastImportedProfileRef.current = profile.id;
    setSelectedProfileId(profile.id);
    setFormData(prev => buildFormFromProfile(profile, prev, replaceForm));
    if (reloadPosts) {
      importPostsFromProfile(profile, true);
    }
  }, [importPostsFromProfile]);

  React.useEffect(() => {
    if (state.socialProfiles.length > 0 && !selectedProfileId) {
      setSelectedProfileId(state.socialProfiles[0].id);
    }
  }, [state.socialProfiles, selectedProfileId]);

  React.useEffect(() => {
    if (hydratedRef.current || !state.brand) return;
    hydratedRef.current = true;
    const b = state.brand;
    const profile = resolveProfile(selectedProfileId);
    const postsFromBrand = normalizePosts(b.contentLibrary?.length ? b.contentLibrary : []);
    const postsFromProfile = profile ? initContentLibraryFromProfile(profile) : [];

    setFormData({
      name: b.name || profile?.name || '',
      segment: b.segment || profile?.category || '',
      subSegment: b.subSegment || '',
      about: b.about || profile?.about || profile?.instagram?.biography || '',
      city: b.city || '',
      website: b.website || '',
      whatsapp: b.whatsapp || '',
      logoUrl: b.logoUrl || profile?.facebook?.pictureUrl || profile?.instagram?.pictureUrl || '',
      logoUrlTransparent: b.logoUrlTransparent || '',
      logoUrlLight: b.logoUrlLight || '',
      logoUrlDark: b.logoUrlDark || '',
    });
    setColors(migrateBrandColors(b.colors));
    setContentLibrary(postsFromBrand.length ? postsFromBrand : postsFromProfile);
    if (profile) {
      setSelectedProfileId(profile.id);
      lastImportedProfileRef.current = profile.id;
    }
  }, [state.brand, state.socialProfiles, resolveProfile, selectedProfileId]);

  React.useEffect(() => {
    if (!selectedProfile) return;
    if (lastImportedProfileRef.current === selectedProfile.id) return;
    if (stage > 1) return;
    importAllFromProfile(selectedProfile, { replaceForm: false, reloadPosts: true });
  }, [state.socialProfiles.length, selectedProfile?.id, stage, importAllFromProfile, selectedProfile]);

  React.useEffect(() => {
    if (stage !== 2 || !selectedProfile) return;
    setFormData(prev => {
      const neverImported = lastImportedProfileRef.current !== selectedProfile.id;
      const formEmpty = !prev.name?.trim() && !prev.about?.trim() && !prev.segment?.trim();
      if (!neverImported && !formEmpty) return prev;
      lastImportedProfileRef.current = selectedProfile.id;
      return buildFormFromProfile(selectedProfile, prev, formEmpty);
    });
    importPostsFromProfile(selectedProfile, false);
  }, [stage, selectedProfileId, selectedProfile, importPostsFromProfile]);

  React.useEffect(() => {
    if (stage !== 3 || !selectedProfile) return;
    const pic = selectedProfile.facebook?.pictureUrl || selectedProfile.instagram?.pictureUrl;
    if (pic && !formData.logoUrl) {
      setFormData(prev => ({ ...prev, logoUrl: pic }));
    }
  }, [stage, selectedProfileId, selectedProfile, formData.logoUrl]);

  React.useEffect(() => {
    if (stage !== 3 || colorsAutoExtractedRef.current) return;
    if (!formData.name?.trim() || !formData.segment?.trim()) return;
    const isDefault = colors.length === DEFAULT_COLORS.length &&
      colors.every((c, i) => c.toLowerCase() === DEFAULT_COLORS[i].toLowerCase());
    if (!isDefault) return;

    colorsAutoExtractedRef.current = true;
    fetch('/api/extract-colors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: formData.name, segment: formData.segment, tenantId: state.tenantId }),
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.colors)) {
          setColors(mergeExtractedColors(DEFAULT_COLORS, data.colors));
        }
      })
      .catch(() => { colorsAutoExtractedRef.current = false; });
  }, [stage, formData.name, formData.segment, colors, state.tenantId]);

  React.useEffect(() => {
    if (stage !== 4 || !selectedProfile) return;
    importPostsFromProfile(selectedProfile, false);
  }, [stage, selectedProfileId, selectedProfile, importPostsFromProfile]);

  const goToStage = (target: number) => {
    if (target < 0 || target > LAST_STAGE) return;
    if (!state.brand && target > stage) return;
    setOnboardingStage(target);
  };

  const prevStage = () => goToStage(stage - 1);
  const nextStage = () => goToStage(stage + 1);

  const goToContentLibrary = () => {
    if (selectedProfile) {
      importPostsFromProfile(selectedProfile, false);
    }
    nextStage();
  };

  const changePage = () => {
    goToStage(1);
  };

  const restartOnboarding = () => {
    const msg = state.brand
      ? 'Recomeçar o onboarding? Seus dados salvos no painel serão mantidos até você confirmar uma nova configuração.'
      : 'Recomeçar o onboarding? O progresso desta sessão será perdido.';
    if (!window.confirm(msg)) return;
    hydratedRef.current = false;
    colorsAutoExtractedRef.current = false;
    lastImportedProfileRef.current = null;
    setOnboardingStage(0);
    setFormData({ name: '', segment: '', subSegment: '', about: '', city: '', website: '', whatsapp: '', logoUrl: '', logoUrlTransparent: '', logoUrlLight: '', logoUrlDark: '' });
    setColors([...DEFAULT_COLORS]);
    setContentLibrary([]);
    setSelectedProfileId(state.socialProfiles[0]?.id ?? null);
  };

  const confirmAnalysis = (insights: AnalysisInsights) => {
    const library = buildBrandLibrary(contentLibrary);
    const activeProfile = resolveProfile(selectedProfileId);
    if (activeProfile) setProfiles([activeProfile]);

    setBrand({
      id: state.brand?.id || 'brand-1',
      ...formData,
      subSegment: formData.subSegment || '',
      city: formData.city || '',
      website: formData.website || '',
      whatsapp: formData.whatsapp || '',
      contentLibrary: library.contentLibrary,
      productPhotos: library.productPhotos,
      colors,
      fonts: state.brand?.fonts || { heading: 'Space Grotesk', body: 'Inter' },
    } as Brand);
    setInsights(insights);
    setOnboardingStage(0);
    setViewState('dashboard');
  };

  const connectNetworks = () => connectMetaOAuth();

  const canClickStep = (stepIndex: number) => state.brand ? true : stepIndex <= stage;

  return (
    <div className="h-full flex flex-col bg-slate-950 relative">
      <div className="pt-8 px-8 pb-2">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4 mb-4">
          <button
            onClick={() => setViewState('dashboard')}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300"
          >
            <X className="w-4 h-4" /> Sair
          </button>
          <button
            onClick={restartOnboarding}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-amber-400"
          >
            <RotateCcw className="w-4 h-4" /> Recomeçar
          </button>
        </div>

        {state.brand && (
          <div className="max-w-3xl mx-auto mb-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-sm text-indigo-300">
            Configuração existente carregada. Clique em qualquer etapa abaixo para editar.
          </div>
        )}

        {selectedProfile && stage >= 2 && (
          <div className="max-w-3xl mx-auto mb-4 flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-3 min-w-0">
              {(selectedProfile.facebook?.pictureUrl || selectedProfile.instagram?.pictureUrl) && (
                <img
                  src={selectedProfile.facebook?.pictureUrl || selectedProfile.instagram?.pictureUrl}
                  alt=""
                  className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-200 truncate">{selectedProfile.name}</p>
                {selectedProfile.instagram && (
                  <p className="text-xs text-slate-500 truncate">{selectedProfile.instagram.handle}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              <button
                onClick={() => selectedProfile && importAllFromProfile(selectedProfile, { replaceForm: true, reloadPosts: true })}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-indigo-300"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reimportar Meta
              </button>
              <button
                onClick={changePage}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300"
              >
                Trocar página
              </button>
            </div>
          </div>
        )}

        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between relative mb-2">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-slate-800 w-full rounded-full z-0" />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-500 rounded-full z-0 transition-all duration-500"
              style={{ width: `${(stage / LAST_STAGE) * 100}%` }}
            />
            {STAGE_LABELS.map((label, s) => (
              <button
                key={label}
                type="button"
                disabled={!canClickStep(s)}
                onClick={() => canClickStep(s) && goToStage(s)}
                className={`flex flex-col items-center z-10 flex-1 ${canClickStep(s) ? 'cursor-pointer' : 'cursor-default opacity-60'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${
                  stage >= s ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-900 border-slate-700 text-slate-500'
                } ${stage === s ? 'ring-2 ring-indigo-400/50' : ''}`}>
                  {stage > s ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-xs font-bold">{s + 1}</span>}
                </div>
                <span className={`text-[10px] mt-1 hidden sm:block ${stage === s ? 'text-indigo-400 font-bold' : 'text-slate-500'}`}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-20">
        <div className="max-w-3xl mx-auto pt-4">
          <AnimatePresence mode="wait">

            {stage === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-display font-bold mb-4 text-slate-200">Conectar Redes</h2>
                  <p className="text-slate-400">Precisamos de acesso para analisar seu público e importar posts existentes.</p>
                </div>
                <div className="flex flex-col items-center max-w-xl mx-auto gap-4">
                  {state.socialProfiles.length > 0 && (
                    <div className="w-full bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-2xl text-center">
                      <p className="text-indigo-300 font-medium mb-4">{state.socialProfiles.length} perfil(is) conectado(s).</p>
                      <button onClick={nextStage} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold w-full">
                        Continuar com páginas conectadas
                      </button>
                    </div>
                  )}
                  <button onClick={connectNetworks} className="w-full flex items-center justify-center gap-6 p-8 bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl transition-all group">
                    <div className="flex -space-x-4">
                      <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center bg-slate-900"><Facebook className="w-8 h-8" /></div>
                      <div className="w-16 h-16 rounded-2xl bg-pink-500/10 text-pink-400 border border-pink-500/20 flex items-center justify-center bg-slate-900"><Instagram className="w-8 h-8" /></div>
                    </div>
                    <div className="text-left">
                      <span className="block font-bold text-slate-200 text-xl">{state.socialProfiles.length > 0 ? 'Conectar outra conta' : 'Conectar Meta Business'}</span>
                      <span className="block text-sm text-slate-400 mt-1">Páginas Facebook e Instagram</span>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {stage === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-display font-bold mb-4 text-slate-200">Selecionar Página</h2>
                  <p className="text-slate-400">Qual página deseja gerenciar?</p>
                </div>
                {state.socialProfiles.length === 0 ? (
                  <div className="text-center p-8 bg-slate-900 border border-slate-800 rounded-2xl">
                    <p className="text-slate-400 mb-4">Nenhuma página conectada ainda.</p>
                    <button onClick={prevStage} className="text-indigo-400 font-bold text-sm">Voltar e conectar Meta</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {state.socialProfiles.map(p => (
                      <label key={p.id} onClick={() => setSelectedProfileId(p.id)} className={`block p-4 border rounded-xl cursor-pointer transition-colors ${selectedProfileId === p.id ? 'bg-slate-800 border-indigo-500' : 'bg-slate-900 border-slate-800 hover:border-indigo-500/50'}`}>
                        <div className="flex items-center gap-4 mb-3">
                          <input type="radio" checked={selectedProfileId === p.id} onChange={() => setSelectedProfileId(p.id)} className="w-5 h-5 accent-indigo-500" />
                          <span className="font-bold text-slate-200 text-lg">{p.name}</span>
                        </div>
                        {p.instagram && (
                          <div className="pl-9 flex items-center gap-2 text-slate-400">
                            <Instagram className="w-4 h-4 text-pink-400" />
                            <span className="text-sm">{p.instagram.handle}</span>
                            <span className="text-[10px] font-bold uppercase text-slate-600 border border-slate-800 rounded px-2 py-0.5">{p.instagram.followers.toLocaleString()} seguidores</span>
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                )}
                <div className="flex justify-between pt-8">
                  <button onClick={prevStage} className="flex items-center gap-2 text-slate-400 hover:text-slate-200 px-4 py-3 rounded-xl font-bold text-sm">
                    <ArrowLeft className="w-4 h-4" /> Voltar
                  </button>
                  <button
                    disabled={!selectedProfileId}
                    onClick={() => {
                      const profile = resolveProfile(selectedProfileId);
                      if (profile) {
                        importAllFromProfile(profile, { replaceForm: true, reloadPosts: true });
                      }
                      nextStage();
                    }}
                    className={`px-8 py-3 rounded-xl font-bold transition-colors ${selectedProfileId ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                  >
                    Continuar
                  </button>
                </div>
              </motion.div>
            )}

            {stage === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-4xl font-display font-bold mb-4 text-slate-200">Perfil da Empresa</h2>
                  <p className="text-slate-400">Ajude a IA a entender seu negócio.</p>
                  {selectedProfile && (
                    <button
                      type="button"
                      onClick={() => importAllFromProfile(selectedProfile, { replaceForm: true, reloadPosts: false })}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-indigo-400 hover:text-indigo-300 px-4 py-2 bg-indigo-500/10 rounded-lg"
                    >
                      <RefreshCw className="w-4 h-4" /> Importar dados da página Meta
                    </button>
                  )}
                </div>
                <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 grid grid-cols-2 gap-6">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Nome da empresa</label>
                    <input type="text" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Segmento</label>
                    <input type="text" value={formData.segment || ''} onChange={e => setFormData({ ...formData, segment: e.target.value })} placeholder="Ex: Saúde e Fitness" className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Sobre e público-alvo</label>
                    <textarea rows={4} value={formData.about || ''} onChange={e => setFormData({ ...formData, about: e.target.value })} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Cidade</label>
                    <input type="text" value={formData.city || ''} onChange={e => setFormData({ ...formData, city: e.target.value })} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Website</label>
                    <input type="url" value={formData.website || ''} onChange={e => setFormData({ ...formData, website: e.target.value })} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-200" />
                  </div>
                </div>
                <div className="flex justify-between pt-4">
                  <button onClick={prevStage} className="flex items-center gap-2 text-slate-400 hover:text-slate-200 px-4 py-3 rounded-xl font-bold text-sm">
                    <ArrowLeft className="w-4 h-4" /> Voltar
                  </button>
                  <button onClick={nextStage} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold">Continuar</button>
                </div>
              </motion.div>
            )}

            {stage === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-display font-bold mb-4 text-slate-200">Identidade Visual</h2>
                  <p className="text-slate-400">Configure logo e cores da marca.</p>
                </div>
                <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800">
                  <div className="mb-8 pb-8 border-b border-slate-800">
                    <div className="flex items-center gap-6 mb-6">
                      <LogoUploadField
                        label="Logo principal"
                        value={formData.logoUrl}
                        tenantId={state.tenantId}
                        category="logo"
                        onChange={(url) => setFormData({ ...formData, logoUrl: url })}
                      />
                      <div>
                        <h4 className="font-bold text-slate-200 text-xl">Logo da marca</h4>
                        <button onClick={() => {
                          const pic = selectedProfile?.facebook?.pictureUrl || selectedProfile?.instagram?.pictureUrl;
                          if (pic) setFormData(prev => ({ ...prev, logoUrl: pic }));
                        }} className="text-xs font-bold text-indigo-400 mt-2">Importar da página social</button>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Versões opcionais</p>
                    <div className="flex flex-wrap gap-4">
                      <LogoUploadField
                        label="Sem fundo"
                        hint="PNG transparente"
                        value={formData.logoUrlTransparent}
                        tenantId={state.tenantId}
                        category="logo_transparent"
                        onChange={(url) => setFormData({ ...formData, logoUrlTransparent: url })}
                      />
                      <LogoUploadField
                        label="Versão clara"
                        hint="Para fundos escuros"
                        value={formData.logoUrlLight}
                        tenantId={state.tenantId}
                        category="logo_light"
                        onChange={(url) => setFormData({ ...formData, logoUrlLight: url })}
                        previewClassName="bg-slate-700"
                      />
                      <LogoUploadField
                        label="Versão escura"
                        hint="Para fundos claros"
                        value={formData.logoUrlDark}
                        tenantId={state.tenantId}
                        category="logo_dark"
                        onChange={(url) => setFormData({ ...formData, logoUrlDark: url })}
                        previewClassName="bg-slate-200"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-slate-200">Cores da marca</h4>
                    <button onClick={async () => {
                      const res = await fetch('/api/extract-colors', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: formData.name, segment: formData.segment, tenantId: state.tenantId }),
                      });
                      const data = await res.json();
                      if (Array.isArray(data.colors)) {
                        setColors(mergeExtractedColors(colors, data.colors));
                      }
                    }} className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 rounded-lg">
                      <BrainCircuit className="w-3.5 h-3.5" /> Extrair automaticamente
                    </button>
                  </div>
                  <BrandColorsEditor colors={colors} onChange={setColors} />
                </div>
                <div className="flex justify-between pt-8">
                  <button onClick={prevStage} className="flex items-center gap-2 text-slate-400 hover:text-slate-200 px-4 py-3 rounded-xl font-bold text-sm">
                    <ArrowLeft className="w-4 h-4" /> Voltar
                  </button>
                  <button onClick={goToContentLibrary} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2">
                    Continuar <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {stage === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="mb-4 flex justify-between items-center">
                  <button onClick={prevStage} className="flex items-center gap-2 text-slate-400 hover:text-slate-200 px-2 py-2 rounded-xl font-bold text-sm">
                    <ArrowLeft className="w-4 h-4" /> Voltar
                  </button>
                  {selectedProfile && (
                    <button
                      onClick={() => importPostsFromProfile(selectedProfile, true)}
                      className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Reimportar posts do Instagram
                    </button>
                  )}
                </div>
                <ContentLibraryStep
                  profile={selectedProfile}
                  posts={contentLibrary}
                  onChange={setContentLibrary}
                  tenantId={state.tenantId}
                  onContinue={nextStage}
                />
              </motion.div>
            )}

            {stage === 5 && (
              <motion.div key="s5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <ProfileAnalysisStep
                  brand={formData}
                  profiles={selectedProfile ? [selectedProfile] : state.socialProfiles}
                  contentLibrary={contentLibrary}
                  tenantId={state.tenantId}
                  onConfirm={confirmAnalysis}
                  onBack={prevStage}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
