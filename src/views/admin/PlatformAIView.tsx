import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/AppContext';
import { useAdmin } from '../../hooks/useAdmin';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import type { AIProvider } from '../../types';

export function PlatformAIView() {
  const { state } = useAppStore();
  const { platformAI, setPlatformAI, availableModels, loading, fetchPlatformAI, savePlatformAI } = useAdmin(state.adminApiKey);
  const [showGemini, setShowGemini] = useState(false);
  const [showOpenai, setShowOpenai] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchPlatformAI();
  }, [fetchPlatformAI]);

  const getModels = (task: 'text' | 'image', provider: AIProvider) => {
    if (!availableModels) return [];
    return availableModels[task][provider] || [];
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await savePlatformAI(platformAI);
      setSaved(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !platformAI.textModel) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-3xl font-display font-bold text-slate-200 mb-2">Configuração IA Global</h1>
      <p className="text-sm text-slate-400 mb-8">
        Chaves e modelos padrão usados por todos os tenants que optarem por chaves da plataforma.
      </p>

      {saved && (
        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Configuração global salva.
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-slate-200 mb-4">Chaves de API da Plataforma</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Gemini API Key</label>
              <div className="relative">
                <input
                  type={showGemini ? 'text' : 'password'}
                  value={platformAI.geminiApiKey}
                  onChange={(e) => setPlatformAI({ ...platformAI, geminiApiKey: e.target.value })}
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pr-12 text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                />
                <button type="button" onClick={() => setShowGemini(!showGemini)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                  {showGemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">OpenAI API Key</label>
              <div className="relative">
                <input
                  type={showOpenai ? 'text' : 'password'}
                  value={platformAI.openaiApiKey}
                  onChange={(e) => setPlatformAI({ ...platformAI, openaiApiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pr-12 text-slate-200 font-mono focus:outline-none focus:border-amber-500"
                />
                <button type="button" onClick={() => setShowOpenai(!showOpenai)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                  {showOpenai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-slate-200 mb-4">Padrões de Texto</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Provedor</label>
              <select
                value={platformAI.textProvider}
                onChange={(e) => {
                  const provider = e.target.value as AIProvider;
                  const models = getModels('text', provider);
                  setPlatformAI({
                    ...platformAI,
                    textProvider: provider,
                    textModel: models[0]?.id || platformAI.textModel,
                  });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="gemini">Gemini</option>
                <option value="openai">OpenAI</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Modelo</label>
              <select
                value={platformAI.textModel}
                onChange={(e) => setPlatformAI({ ...platformAI, textModel: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-amber-500"
              >
                {getModels('text', platformAI.textProvider).map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-slate-200 mb-4">Padrões de Imagem</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Provedor</label>
              <select
                value={platformAI.imageProvider}
                onChange={(e) => {
                  const provider = e.target.value as AIProvider;
                  const models = getModels('image', provider);
                  setPlatformAI({
                    ...platformAI,
                    imageProvider: provider,
                    imageModel: models[0]?.id || platformAI.imageModel,
                  });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="gemini">Gemini</option>
                <option value="openai">OpenAI</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Modelo</label>
              <select
                value={platformAI.imageModel}
                onChange={(e) => setPlatformAI({ ...platformAI, imageModel: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-amber-500"
              >
                {getModels('image', platformAI.imageProvider).map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Salvar Configuração Global
        </button>
      </div>
    </div>
  );
}
