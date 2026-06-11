import React, { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { Image as ImageIcon, Sparkles, Loader2, Download, Wand2, X, Maximize2 } from 'lucide-react';

export function ImageGeneratorView() {
  const { state } = useAppStore();
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [generatedImage, setGeneratedImage] = useState<{ url: string; prompt: string } | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setGenerating(true);
    setError('');
    
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          brand: state.brand,
          contentLibrary: state.brand?.contentLibrary,
          productPhotos: state.brand?.productPhotos,
          tenantId: state.tenantId,
        })
      });
      
      const data = await res.json();
      
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate');
      }
      
      if (data.imageUrl) {
        setGeneratedImage({
          url: data.imageUrl,
          prompt: data.refinedPrompt || prompt
        });
        if (data.warning) {
           setError('Note: ' + data.warning);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate image');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-8 pb-32 max-w-5xl mx-auto w-full">
      <header className="mb-8 border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-display font-bold text-slate-200 flex items-center gap-3">
          <ImageIcon className="text-indigo-400" /> Image Generator
        </h1>
        <p className="text-slate-400 mt-2">Create marketing assets with Imagen using natural language prompts.</p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
            <h2 className="font-bold text-lg text-slate-200 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" /> Prompt
            </h2>
            
            <textarea
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[160px] resize-none"
              placeholder="A futuristic sports car driving through a neon-lit cyberpunk city at night, high quality, photorealistic..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            
            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className="mt-4 w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
              {generating ? 'Generating...' : 'Generate Image'}
            </button>
            
            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}
            
            <div className="mt-6 pt-6 border-t border-slate-800">
               <h3 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">Tips for better results</h3>
               <ul className="text-sm text-slate-500 space-y-2 list-disc pl-4">
                 <li>Be specific about the subject, setting, and actions.</li>
                 <li>Include art style (e.g., photorealistic, watercolor, 3D render).</li>
                 <li>Mention lighting and mood (e.g., golden hour, dramatic, moody).</li>
               </ul>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm min-h-[600px] flex flex-col items-center justify-center text-center">
            {generating ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                <p className="text-slate-400 font-medium">Generating your image...</p>
                <p className="text-sm text-slate-500 max-w-xs leading-relaxed">This can take a few moments. Our AI runs on Google's Imagen model for high-quality generation.</p>
              </div>
            ) : generatedImage ? (
              <div className="w-full">
                <div className="relative group rounded-xl overflow-hidden border border-slate-800 mb-4 bg-slate-950 flex items-center justify-center">
                  <img src={generatedImage.url} alt={generatedImage.prompt} className="max-w-full max-h-[600px] object-contain cursor-pointer" referrerPolicy="no-referrer" onClick={() => setLightboxOpen(true)} />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button onClick={() => setLightboxOpen(true)} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-2 px-4 rounded-lg backdrop-blur-md transition-colors">
                       <Maximize2 className="w-5 h-5" /> Ampliar
                    </button>
                    <a href={generatedImage.url} download="generated-asset.jpg" target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                       <Download className="w-5 h-5" /> Download Asset
                    </a>
                  </div>
                </div>
                {generatedImage.prompt !== prompt && (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-left">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Refined Prompt Used</span>
                    <p className="text-sm text-slate-300 italic">"{generatedImage.prompt}"</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-500 flex flex-col items-center gap-4">
                <ImageIcon className="w-16 h-16 opacity-20" />
                <p>Your generated assets will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {lightboxOpen && generatedImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setLightboxOpen(false)}>
          <button onClick={() => setLightboxOpen(false)} className="absolute top-4 right-4 text-white/70 hover:text-white">
            <X className="w-8 h-8" />
          </button>
          <img src={generatedImage.url} alt={generatedImage.prompt} className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
