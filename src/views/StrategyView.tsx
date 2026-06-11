import React from 'react';
import { useAppStore } from '../store/AppContext';
import { BrainCircuit, Play, Loader2, ListTree } from 'lucide-react';

export function StrategyView() {
  const { state, generateStrategy, setViewState } = useAppStore();

  if (state.pillars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center max-w-2xl mx-auto">
        <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-slate-800">
          <ListTree className="w-12 h-12 text-indigo-500" />
        </div>
        <h1 className="text-3xl font-display font-bold text-slate-200 mb-4">Plano de Estratégia de Conteúdo</h1>
        <p className="text-lg text-slate-400 mb-8">
          Com base na análise da marca, nossa IA vai definir seus pilares de conteúdo e frequência ideal de publicação.
        </p>
        <button
          onClick={generateStrategy}
          disabled={state.isProcessingAI}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white px-8 py-4 rounded-xl font-bold transition-colors shadow-lg shadow-indigo-600/20"
        >
          {state.isProcessingAI ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
          {state.isProcessingAI ? 'Analisando e pensando...' : 'Gerar estratégia com IA'}
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 pb-32">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-200 tracking-tight">Estratégia de Conteúdo</h1>
          <p className="text-slate-400 mt-1">Gerada pelo agente estrategista de marketing</p>
        </div>
        <button
          onClick={generateStrategy}
          disabled={state.isProcessingAI}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 px-4 py-2 rounded-lg text-sm font-bold transition-colors border border-slate-700"
        >
          {state.isProcessingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
          Regenerar estratégia
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 flex flex-col">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-200">
            <span className="w-8 h-8 rounded bg-orange-500/10 text-orange-500 flex items-center justify-center border border-orange-500/20">1</span>
            Posicionamento da marca
          </h2>
          <div className="space-y-6 flex-1">
            <div>
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Voz e tom</h3>
              <div className="flex gap-2 flex-wrap">
                {state.strategyPlan?.voiceAndTone.map(v => (
                  <span key={v} className="px-3 py-1 bg-slate-950 border border-slate-800 text-slate-300 rounded text-xs font-bold uppercase tracking-widest">{v}</span>
                )) || <span className="px-3 py-1 bg-slate-950 border border-slate-800 text-slate-300 rounded text-xs font-bold uppercase tracking-widest">Profissional</span>}
              </div>
            </div>
            <div>
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Elevator pitch</h3>
              <p className="text-slate-300 text-lg leading-relaxed font-sans italic">
                "{state.strategyPlan?.elevatorPitch || 'Resumo persuasivo da marca.'}"
              </p>
            </div>
            <div>
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Palavras-chave</h3>
              <div className="flex gap-2 flex-wrap">
                {(state.strategyPlan?.keywords || ['Crescimento', 'Marketing', 'Inovação']).map(kw => (
                  <span key={kw} className="text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded text-xs font-bold uppercase">#{kw.toLowerCase().replace(/\s+/g, '')}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 flex flex-col">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-200">
             <span className="w-8 h-8 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">2</span>
             Pilares de conteúdo
          </h2>
          <div className="space-y-4 flex-1">
            {state.pillars.map((pillar, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="w-16 flex-shrink-0 text-center">
                  <span className="block text-2xl font-display font-bold text-indigo-500">{pillar.percentage}%</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-200">{pillar.name}</h4>
                  <p className="text-sm text-slate-400 mt-1">{pillar.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
         <button
          onClick={() => setViewState('calendar')}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-bold transition-colors shadow-lg"
        >
          Ir para geração de conteúdo <Play className="w-5 h-5 fill-current" />
        </button>
      </div>
    </div>
  );
}
