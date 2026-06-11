import React from 'react';
import { useAppStore } from '../store/AppContext';
import { Sparkles, ArrowRight, BarChart, Users, Eye, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function DashboardView() {
  const { state, setViewState } = useAppStore();

  if (!state.brand) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center max-w-2xl mx-auto">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center mb-6 border border-slate-800">
          <Sparkles className="w-12 h-12 text-indigo-500" />
        </motion.div>
        <h1 className="text-4xl font-display font-bold text-slate-200 mb-4">Bem-vindo ao Marketing AI OS</h1>
        <p className="text-lg text-slate-400 mb-8">
          Conecte suas redes, importe posts existentes e deixe a IA analisar seu perfil antes de criar conteúdo.
        </p>
        <button onClick={() => setViewState('onboarding')} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-medium shadow-lg shadow-indigo-600/20">
          Iniciar configuração <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  const chartData = [
    { name: 'Seg', followers: 4000, reach: 2400 },
    { name: 'Ter', followers: 4200, reach: 1398 },
    { name: 'Qua', followers: 4400, reach: 9800 },
    { name: 'Qui', followers: 4800, reach: 3908 },
    { name: 'Sex', followers: 5100, reach: 4800 },
    { name: 'Sáb', followers: 5200, reach: 3800 },
    { name: 'Dom', followers: 5500, reach: 14300 },
  ];

  const getMetrics = () => {
    let totalFollowers = 0;
    state.socialProfiles.forEach(p => {
      totalFollowers += p.facebook?.followers || 0;
      totalFollowers += p.instagram?.followers || 0;
    });
    return {
      audience: totalFollowers >= 1000 ? (totalFollowers / 1000).toFixed(1) + 'K' : totalFollowers.toString(),
      reach: totalFollowers > 0 ? (totalFollowers * 1.5 >= 1000 ? (totalFollowers * 1.5 / 1000).toFixed(1) + 'K' : (totalFollowers * 1.5).toString()) : '0',
    };
  };

  const metrics = getMetrics();
  const insights = state.insights;

  return (
    <div className="p-8 pb-32">
      <header className="mb-8">
        <h1 className="text-3xl font-display font-bold text-slate-200">Painel Executivo</h1>
        <p className="text-slate-400 mt-1">Insights de IA para {state.brand.name}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <MetricCard label="Audiência total" value={metrics.audience} icon={Users} trend="+14%" />
        <MetricCard label="Alcance semanal" value={metrics.reach} icon={Eye} trend="+42%" />
        <MetricCard label="Taxa de engajamento" value="5,8%" icon={TrendingUp} trend="+1,2%" />
        <MetricCard label="Posts gerados" value={state.posts.length.toString()} icon={BarChart} trend="+8" />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-8 bg-slate-900 rounded-2xl border border-slate-800 p-6">
          <h3 className="font-bold text-lg mb-6 text-slate-200">Crescimento e alcance</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#f1f5f9' }} />
                <Line yAxisId="left" type="monotone" dataKey="followers" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} />
                <Line yAxisId="right" type="monotone" dataKey="reach" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 border-t border-slate-800 pt-4 text-xs">
            <div><span className="text-slate-500 block mb-1 uppercase">Frequência ideal</span><span className="font-bold text-slate-200">{insights?.idealFrequency || '4x/semana'}</span></div>
            <div><span className="text-slate-500 block mb-1 uppercase">Melhor horário</span><span className="font-bold text-slate-200">{insights?.idealTimes?.[0] || '18:00'}</span></div>
            <div><span className="text-slate-500 block mb-1 uppercase">Tema principal</span><span className="font-bold text-slate-200">{insights?.topThemes?.[0] || '—'}</span></div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="text-indigo-400 w-6 h-6" />
            <h3 className="font-bold text-lg text-slate-200">Análise do perfil</h3>
          </div>

          <div className="space-y-5 flex-1 overflow-y-auto">
            <InsightSection title="O que funciona" items={insights?.whatWorks} color="text-emerald-500" fallback={['Conteúdo visual autêntico']} />
            <InsightSection title="O que não funciona" items={insights?.whatDoesntWork} color="text-red-400" fallback={['Posts irregulares']} />
            <InsightSection title="Sugestões" items={insights?.suggestions} color="text-amber-400" fallback={['Engaje nos comentários']} />
            <InsightSection title="Temas principais" items={insights?.topThemes} color="text-indigo-400" fallback={['Bastidores', 'Dicas']} />
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Cadência</p>
              <p className="text-sm text-slate-300">{insights?.idealFrequency || '4 vezes por semana'}</p>
              <p className="text-xs text-slate-500 mt-1">Horários: {insights?.idealTimes?.join(', ') || '09:00, 18:00'}</p>
            </div>
          </div>

          <button onClick={() => setViewState('strategy')} className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-lg text-sm font-bold">
            Ver estratégia de conteúdo
          </button>
        </div>
      </div>
    </div>
  );
}

function InsightSection({ title, items, color, fallback }: { title: string; items?: string[]; color: string; fallback: string[] }) {
  return (
    <div>
      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">{title}</p>
      <ul className="space-y-1">
        {(items || fallback).map((item, i) => (
          <li key={i} className="text-sm text-slate-300 flex gap-2"><span className={color}>•</span>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, trend }: { label: string; value: string; icon: React.ElementType; trend: string }) {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">{label}</p>
          <p className="text-3xl font-display font-bold text-slate-200">{value}</p>
        </div>
        <div className="p-2 bg-slate-800/50 border border-slate-700/50 text-indigo-400 rounded-lg"><Icon className="w-5 h-5" /></div>
      </div>
      <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">{trend} últimos 7 dias</span>
    </div>
  );
}
