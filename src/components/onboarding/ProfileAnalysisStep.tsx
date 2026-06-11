import React, { useEffect, useState } from 'react';
import { AnalysisInsights, Brand, SocialProfile, InstagramPost } from '../../types';
import { Loader2, CheckCircle2, XCircle, Lightbulb, Hash, Clock } from 'lucide-react';

interface ProfileAnalysisStepProps {
  brand: Partial<Brand>;
  profiles: SocialProfile[];
  contentLibrary: InstagramPost[];
  tenantId: string;
  onConfirm: (insights: AnalysisInsights) => void;
  onBack?: () => void;
}

export function ProfileAnalysisStep({ brand, profiles, contentLibrary, tenantId, onConfirm, onBack }: ProfileAnalysisStepProps) {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<AnalysisInsights | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/generate-insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brand, profiles, contentLibrary, tenantId }),
        });
        const data = await res.json();
        setInsights(data);
      } catch (e: any) {
        setError(e.message);
        setInsights({
          whatWorks: ['Conteúdo visual de alta qualidade', 'Publicações com storytelling'],
          whatDoesntWork: ['Posts irregulares', 'Pouco engajamento nos comentários'],
          idealFrequency: '4 vezes por semana',
          idealTimes: ['09:00', '18:00'],
          topThemes: ['Bastidores', 'Dicas do segmento', 'Depoimentos'],
          suggestions: ['Responda comentários rapidamente', 'Use enquetes nos Stories'],
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [brand, profiles, contentLibrary, tenantId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-6" />
        <h2 className="text-2xl font-display font-bold text-slate-200 mb-2">Analisando seu perfil...</h2>
        <p className="text-slate-400 max-w-md">A IA está lendo seus posts, métricas e bio para gerar recomendações.</p>
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-display font-bold mb-4 text-slate-200">Análise do Perfil</h2>
        <p className="text-slate-400">Revise os pontos fortes, fracos e sugestões antes de criar conteúdo.</p>
      </div>

      {error && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-sm">
          Usando análise de fallback: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnalysisCard title="O que funciona" icon={CheckCircle2} iconColor="text-emerald-400" items={insights.whatWorks} />
        <AnalysisCard title="O que não funciona" icon={XCircle} iconColor="text-red-400" items={insights.whatDoesntWork} />
        <AnalysisCard title="Sugestões" icon={Lightbulb} iconColor="text-amber-400" items={insights.suggestions} />
        <AnalysisCard title="Temas principais" icon={Hash} iconColor="text-indigo-400" items={insights.topThemes} />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-slate-200">Cadência ideal</h3>
        </div>
        <p className="text-slate-300 mb-2">{insights.idealFrequency}</p>
        <p className="text-sm text-slate-400">Melhores horários: {insights.idealTimes.join(', ')}</p>
      </div>

      <div className="flex justify-between pt-4">
        {onBack ? (
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-slate-200 px-4 py-3 rounded-xl font-bold text-sm"
          >
            Voltar
          </button>
        ) : <div />}
        <button
          onClick={() => onConfirm(insights)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors"
        >
          Confirmar e Ir ao Painel
        </button>
      </div>
    </div>
  );
}

function AnalysisCard({ title, icon: Icon, iconColor, items }: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  items: string[];
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        <h3 className="font-bold text-slate-200">{title}</h3>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-slate-300 flex gap-2">
            <span className={iconColor}>•</span> {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
