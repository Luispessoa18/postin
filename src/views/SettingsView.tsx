import React, { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { useAISettings } from '../hooks/useAISettings';
import { CompanySettingsTab } from '../components/settings/CompanySettingsTab';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import type { AIProvider } from '../types';
import { cn } from '../lib/utils';

function AISettingsPanel() {
  const { state } = useAppStore();
  const { settings, loading, saving, error, saved, updateField, save, getModelsForProvider } = useAISettings(state.tenantId);
  const [showGemini, setShowGemini] = useState(false);
  const [showOpenai, setShowOpenai] = useState(false);

  if (loading) {
    return <div className="flex justify-center p-16"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  }

  const textModels = getModelsForProvider('text', settings.textProvider);
  const imageModels = getModelsForProvider('image', settings.imageProvider);

  return (
    <div className="space-y-6">
      {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}
      {saved && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Configurações salvas.
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-slate-200 mb-4">Chaves de API</h2>
        <label className="flex items-center gap-3 mb-6 cursor-pointer">
          <input type="checkbox" checked={settings.usePlatformKeys} onChange={(e) => updateField('usePlatformKeys', e.target.checked)} className="w-4 h-4 rounded" />
          <span className="text-sm text-slate-300">Usar chaves padrão da plataforma</span>
        </label>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">Chave API Gemini</label>
            <div className="relative">
              <input type={showGemini ? 'text' : 'password'} value={settings.geminiApiKey} onChange={(e) => updateField('geminiApiKey', e.target.value)} disabled={settings.usePlatformKeys} placeholder="AIzaSy..." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pr-12 text-slate-200 font-mono disabled:opacity-50" />
              <button type="button" onClick={() => setShowGemini(!showGemini)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">{showGemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">Chave API OpenAI (GPT)</label>
            <div className="relative">
              <input type={showOpenai ? 'text' : 'password'} value={settings.openaiApiKey} onChange={(e) => updateField('openaiApiKey', e.target.value)} disabled={settings.usePlatformKeys} placeholder="sk-..." className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pr-12 text-slate-200 font-mono disabled:opacity-50" />
              <button type="button" onClick={() => setShowOpenai(!showOpenai)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">{showOpenai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-slate-200 mb-4">IA de Texto</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">Provedor</label>
            <select value={settings.textProvider} onChange={(e) => { const p = e.target.value as AIProvider; updateField('textProvider', p); const m = getModelsForProvider('text', p); if (m[0]) updateField('textModel', m[0].id); }} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200">
              <option value="gemini">Google Gemini</option>
              <option value="openai">OpenAI (GPT)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">Modelo</label>
            <select value={settings.textModel} onChange={(e) => updateField('textModel', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200">
              {textModels.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-slate-200 mb-4">IA de Imagem</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">Provedor</label>
            <select value={settings.imageProvider} onChange={(e) => { const p = e.target.value as AIProvider; updateField('imageProvider', p); const m = getModelsForProvider('image', p); if (m[0]) updateField('imageModel', m[0].id); }} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200">
              <option value="gemini">Google Gemini</option>
              <option value="openai">OpenAI (DALL-E)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">Modelo</label>
            <select value={settings.imageModel} onChange={(e) => updateField('imageModel', e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200">
              {imageModels.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <button onClick={save} disabled={saving} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        Salvar configurações de IA
      </button>
    </div>
  );
}

export function SettingsView() {
  const [tab, setTab] = useState<'empresa' | 'ia'>('empresa');

  return (
    <div className="p-8 max-w-2xl mx-auto w-full">
      <h1 className="text-3xl font-display font-bold text-slate-200 mb-2">Configurações</h1>
      <p className="text-sm text-slate-400 mb-6">Gerencie sua empresa e preferências de IA.</p>

      <div className="flex gap-2 mb-8 border-b border-slate-800">
        {(['empresa', 'ia'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-sm font-bold border-b-2 -mb-px transition-colors',
              tab === t ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            )}
          >
            {t === 'empresa' ? 'Empresa' : 'Inteligência Artificial'}
          </button>
        ))}
      </div>

      {tab === 'empresa' ? <CompanySettingsTab /> : <AISettingsPanel />}
    </div>
  );
}
