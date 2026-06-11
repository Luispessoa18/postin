import React, { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { Calendar as CalendarIcon, Sparkles, Check, Loader2, RefreshCw, Image as ImageIcon, Maximize2, Smartphone, X } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Post } from '../types';
import { PostPreviewModal } from '../components/PostPreviewModal';

export function CalendarView() {
  const { state, setViewState, setPosts, generateCalendarPosts } = useAppStore();
  const [generating, setGenerating] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [generatingImages, setGeneratingImages] = useState<Record<string, boolean>>({});
  const [generatingStories, setGeneratingStories] = useState<Record<string, boolean>>({});
  const [previewPost, setPreviewPost] = useState<Post | null>(null);
  const [storyPreviewUrl, setStoryPreviewUrl] = useState<string | null>(null);

  const generateCalendar = async () => {
    setCalendarError(null);
    if (!state.brand) {
      setCalendarError('Complete o onboarding da marca antes de gerar o calendário.');
      return;
    }
    setGenerating(true);
    try {
      const newPosts = await generateCalendarPosts();
      const today = new Date();
      const formattedPosts = newPosts.map((t, index) => ({
        id: `post-${Date.now()}-${index}`,
        theme: t.theme,
        pilar: t.pilar,
        objective: 'Engajamento',
        cta: 'Salve este post!',
        platform: index % 3 === 0 ? 'linkedin' : (index % 2 === 0 ? 'facebook' : 'instagram'),
        format: t.format,
        date: addDays(today, Math.floor(index / 2)),
        status: index === 0 ? 'review' : 'draft',
        copy: t.copy || {
          headline: `Atenção: ${t.theme}`,
          body: 'Copy detalhada gerada pela IA.',
          hashtags: ['#marca']
        },
        prompt: undefined,
      })) as Post[];

      const keptPosts = state.posts.filter(p => p.status === 'approved' || p.status === 'published' || p.status === 'scheduled');
      setPosts([...keptPosts, ...formattedPosts]);
    } catch (e: any) {
      console.error(e);
      setCalendarError(e.message || 'Falha ao gerar calendário');
    } finally {
      setGenerating(false);
    }
  };

  const generateImageForPost = async (post: Post) => {
    setGeneratingImages(prev => ({ ...prev, [post.id]: true }));
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post,
          brand: state.brand,
          contentLibrary: state.brand?.contentLibrary,
          productPhotos: state.brand?.productPhotos,
          tenantId: state.tenantId,
        })
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Falha ao gerar imagem');
      }

      if (data.imageUrl) {
        setPosts(state.posts.map(p => p.id === post.id ? {
          ...p,
          imageUrl: data.imageUrl,
          prompt: data.refinedPrompt || p.prompt,
          status: 'review',
        } : p));
      }
    } catch (e: any) {
      console.error(e);
      alert(`Erro ao gerar imagem: ${e.message}`);
    }
    setGeneratingImages(prev => ({ ...prev, [post.id]: false }));
  };

  const generateStoryForPost = async (post: Post) => {
    if (!post.imageUrl) return;
    setGeneratingStories(prev => ({ ...prev, [post.id]: true }));
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post: { ...post, format: 'story' },
          brand: state.brand,
          contentLibrary: state.brand?.contentLibrary,
          productPhotos: state.brand?.productPhotos,
          sourceImageUrl: post.imageUrl,
          tenantId: state.tenantId,
        })
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Falha ao gerar versão Stories');
      }

      if (data.imageUrl) {
        setPosts(state.posts.map(p => p.id === post.id ? { ...p, storyImageUrl: data.imageUrl } : p));
      }
    } catch (e: any) {
      console.error(e);
      alert(`Erro ao gerar Stories: ${e.message}`);
    }
    setGeneratingStories(prev => ({ ...prev, [post.id]: false }));
  };

  if (state.posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center max-w-2xl mx-auto">
        <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-slate-800">
          <CalendarIcon className="w-12 h-12 text-indigo-500" />
        </div>
        <h1 className="text-3xl font-display font-bold text-slate-200 mb-4">Planejador de Conteúdo</h1>
        <p className="text-lg text-slate-400 mb-8 font-sans">
          A IA vai gerar um calendário semanal adaptado à frequência ideal de publicação da sua marca.
        </p>
        {calendarError && (
          <div className="w-full mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{calendarError}</div>
        )}
        <button
          onClick={generateCalendar}
          disabled={generating}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white px-8 py-4 rounded-xl font-bold transition-colors shadow-lg shadow-indigo-600/20"
        >
          {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {generating ? 'Gerando plano semanal...' : 'Gerar calendário'}
        </button>
      </div>
    );
  }

  const sortedPosts = [...state.posts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="p-8 pb-32">
      <header className="mb-8 flex justify-between items-end border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-200 tracking-tight">Calendário de Conteúdo</h1>
          <p className="text-slate-400 mt-1">Revise e gerencie sua programação</p>
        </div>
        <div className="flex gap-3">
           <button onClick={async () => {
             const missingImages = state.posts.filter(p => !p.imageUrl);
             for (const p of missingImages) {
               await generateImageForPost(p);
             }
           }} disabled={generating || state.posts.every(p => !!p.imageUrl)} className="flex items-center gap-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50">
             <ImageIcon className="w-4 h-4" /> Gerar todas as imagens
           </button>
           <button onClick={generateCalendar} disabled={generating} className="flex items-center gap-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50">
             {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Regenerar semana
           </button>
           <button onClick={() => setViewState('approvals')} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-lg shadow-indigo-600/20">
             <Check className="w-4 h-4" /> Ir para aprovações
           </button>
        </div>
      </header>

      {calendarError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{calendarError}</div>
      )}

      <div className="space-y-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between mb-2">
          <div className="text-sm font-bold text-slate-200">
            <span className="text-indigo-400">Plano Pro ativo:</span> 40 posts/mês (10/semana)
          </div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Semana 1
          </div>
        </div>
        {sortedPosts.map((post) => (
          <div key={post.id} className="bg-slate-900 border text-left border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row">
            <div className="w-full md:w-32 flex-shrink-0 flex flex-col justify-center items-center p-4 bg-slate-950 border-r border-slate-800">
               <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{format(new Date(post.date), 'EEEE')}</span>
               <span className="text-3xl font-display font-bold text-slate-200 leading-none my-1">{format(new Date(post.date), 'dd')}</span>
               <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{format(new Date(post.date), 'MMM')}</span>
            </div>

            <div className="flex-1 p-6 flex flex-col justify-center">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-bold text-slate-200 leading-tight">{post.theme}</h3>
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border border-current ${
                  post.status === 'draft' ? 'bg-orange-500/10 text-orange-400' :
                  post.status === 'review' ? 'bg-blue-500/10 text-blue-400' :
                  'bg-emerald-500/10 text-emerald-400'
                }`}>
                  {post.status}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2 py-1 bg-slate-800/50 border border-slate-700 text-slate-300 rounded text-xs font-bold capitalize">{post.platform}</span>
                <span className="px-2 py-1 bg-slate-800/50 border border-slate-700 text-slate-300 rounded text-xs font-bold">{post.pilar}</span>
                <span className="px-2 py-1 bg-slate-800/50 border border-slate-700 text-slate-300 rounded text-xs font-bold capitalize">{post.format}</span>
              </div>

              {post.copy && (
                 <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mt-2">
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Copy gerada</p>
                   <p className="text-sm text-slate-300 line-clamp-2">{post.copy.headline} {post.copy.body}</p>
                 </div>
              )}
            </div>

            <div className="w-full md:w-64 bg-slate-950/50 border-l border-slate-800 p-4 flex flex-col items-center justify-center">
              {post.imageUrl ? (
                <div className="relative w-full aspect-square rounded-xl overflow-hidden group border border-slate-800">
                  <img src={post.imageUrl} alt={post.theme} className="w-full h-full object-cover cursor-pointer" referrerPolicy="no-referrer" onClick={() => setPreviewPost(post)} />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                     <button
                       onClick={() => setPreviewPost(post)}
                       className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-md transition-all"
                       title="Visualizar post"
                     >
                        <Maximize2 className="w-5 h-5" />
                     </button>
                     <button
                       onClick={() => generateImageForPost(post)}
                       disabled={generatingImages[post.id]}
                       className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-md transition-all"
                       title="Gerar nova imagem"
                     >
                        <RefreshCw className={`w-5 h-5 ${generatingImages[post.id] ? 'animate-spin' : ''}`} />
                     </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => generateImageForPost(post)}
                  disabled={generatingImages[post.id]}
                  className="w-full aspect-square rounded-xl border border-dashed border-slate-700 hover:border-indigo-500/50 hover:bg-indigo-500/5 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-indigo-400 transition-colors disabled:opacity-50"
                >
                  {generatingImages[post.id] ? <Loader2 className="w-6 h-6 animate-spin text-indigo-500" /> : <ImageIcon className="w-6 h-6 mb-1" />}
                  <span className="text-xs font-bold">Gerar imagem</span>
                </button>
              )}

              {post.imageUrl && (
                <div className="w-full mt-3 flex items-center gap-3">
                  {post.storyImageUrl ? (
                    <button
                      onClick={() => setStoryPreviewUrl(post.storyImageUrl!)}
                      className="relative w-12 aspect-[9/16] rounded-lg overflow-hidden border border-slate-700 flex-shrink-0"
                      title="Ver versão Stories"
                    >
                      <img src={post.storyImageUrl} alt="Stories" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ) : (
                    <button
                      onClick={() => generateStoryForPost(post)}
                      disabled={generatingStories[post.id]}
                      className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-400 disabled:opacity-50 transition-colors"
                    >
                      {generatingStories[post.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                      Criar versão Stories
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {previewPost && (
        <PostPreviewModal post={previewPost} brand={state.brand} onClose={() => setPreviewPost(null)} />
      )}

      {storyPreviewUrl && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setStoryPreviewUrl(null)}>
          <button onClick={() => setStoryPreviewUrl(null)} className="absolute top-4 right-4 text-white/70 hover:text-white">
            <X className="w-8 h-8" />
          </button>
          <img src={storyPreviewUrl} alt="Stories" className="max-h-full max-w-full object-contain rounded-2xl" referrerPolicy="no-referrer" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
