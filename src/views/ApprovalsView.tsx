import React, { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { Check, Edit2, Image as ImageIcon, Send, RefreshCcw, Loader2 } from 'lucide-react';

export function ApprovalsView() {
  const { state } = useAppStore();
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const mockPost = {
    theme: '5 mistakes preventing weight loss',
    pilar: 'Education',
    objective: 'Engagement',
    platform: 'instagram',
    format: 'carousel',
    copy: {
      headline: 'You are sabotaging your results without noticing.',
      body: 'Losing weight is simple math, but these 5 common mistakes make it much harder than it needs to be.\n\n1. Not tracking liquid calories.\n2. Overestimating calories burned during exercise.\n3. Skipping meals, leading to binges.\n4. Not getting enough protein.\n5. Lack of sleep affecting your metabolism.',
      hashtags: ['#weightloss', '#fitness', '#gymtips']
    },
    prompt: 'Create an Instagram carousel. Style: Modern fitness brand. Colors: Black, white and orange. Slide 1: Bold title 5 mistakes preventing weight loss. Slide 2: Person looking frustrated in gym.'
  };

  const handleGenerateImage = () => {
    setIsGeneratingImg(true);
    setTimeout(() => {
      // Unsplash placeholder fitness image
      setGeneratedImage('https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80');
      setIsGeneratingImg(false);
    }, 4000);
  };


  return (
    <div className="p-8 pb-32 h-full flex flex-col">
      <header className="mb-8 border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-display font-bold text-slate-200 tracking-tight">AI Approvals</h1>
        <p className="text-slate-400 mt-1">Review generated content before publishing</p>
      </header>

      <div className="flex-1 flex gap-4">
        <div className="flex-1 flex flex-col gap-4">
          
          {/* Editor Board */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm overflow-hidden flex flex-col">
             <div className="p-4 border-b border-slate-800 bg-slate-950/30 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <span className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 font-bold text-xs">AI</span>
                 <div>
                   <p className="font-bold text-sm text-slate-200">Copywriter Agent</p>
                   <p className="text-[10px] text-slate-500 italic">Generated 2 hours ago</p>
                 </div>
               </div>
               <button className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-indigo-400 transition-colors uppercase tracking-widest">
                 <Edit2 className="w-4 h-4" /> Edit Text
               </button>
             </div>
             <div className="p-6">
               <h3 className="text-xl font-bold mb-4 text-slate-200 leading-tight">{mockPost.copy.headline}</h3>
               <p className="text-slate-300 whitespace-pre-line text-sm leading-relaxed mb-4">
                 {mockPost.copy.body}
               </p>
               <p className="text-indigo-400 text-sm font-bold">
                 {mockPost.copy.hashtags.join(' ')}
               </p>
             </div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm overflow-hidden flex flex-col">
             <div className="p-4 border-b border-slate-800 bg-slate-950/30 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <span className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 border border-orange-500/20 font-bold text-xs">AI</span>
                 <div>
                   <p className="font-bold text-sm text-slate-200">Designer Agent</p>
                   <p className="text-[10px] text-slate-500 italic">Generated image prompts</p>
                 </div>
               </div>
                <button className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-orange-400 transition-colors uppercase tracking-widest">
                 <Edit2 className="w-4 h-4" /> Edit Prompt
               </button>
             </div>
             <div className="p-6">
                <div className="bg-slate-950 border border-slate-800 text-slate-300 p-4 rounded-xl font-mono text-xs overflow-x-auto selection:bg-orange-500/30 mb-6">
                  {mockPost.prompt}
                </div>

                {isGeneratingImg ? (
                  <div className="w-full h-64 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center space-y-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-orange-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                      <Loader2 className="w-8 h-8 text-orange-500 animate-spin relative z-10" />
                    </div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Generating Creative Asset...</p>
                  </div>
                ) : generatedImage ? (
                  <div className="w-full rounded-xl overflow-hidden border border-slate-800 shadow-xl shadow-orange-500/10 relative group">
                    <img src={generatedImage} alt="Generated Asset" className="w-full h-auto object-cover" />
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs font-bold text-white uppercase tracking-widest">Format: Instagram Carousel (Slide 1)</p>
                    </div>
                  </div>
                ) : null}
             </div>
          </div>
          
        </div>

        {/* Action Panel */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-4">
           <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-sm">
             <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Quality Control</h4>
             <ul className="space-y-3 mb-6">
               <li className="flex items-center gap-2 text-sm text-slate-300">
                 <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                   <Check className="w-3 h-3 text-emerald-400" />
                 </div>
                 Grammar verified
               </li>
               <li className="flex items-center gap-2 text-sm text-slate-300">
                 <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                   <Check className="w-3 h-3 text-emerald-400" />
                 </div>
                 Brand voice matched
               </li>
               <li className="flex items-center gap-2 text-sm text-slate-300">
                 <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                   <Check className="w-3 h-3 text-emerald-400" />
                 </div>
                 Colors compliant
               </li>
             </ul>

             <div className="space-y-3 pt-4 border-t border-slate-800">
               <button onClick={handleGenerateImage} disabled={isGeneratingImg} className="w-full flex items-center justify-center gap-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 px-4 py-3 rounded-xl font-bold transition-colors disabled:opacity-50">
                 {isGeneratingImg ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                 {isGeneratingImg ? 'Generating...' : 'Generate Image'}
               </button>
                <button className="w-full flex items-center justify-center gap-2 bg-slate-800/50 border border-slate-700 text-slate-300 hover:bg-slate-800 px-4 py-3 rounded-xl font-bold transition-colors">
                 <RefreshCcw className="w-4 h-4" /> Regenerate All
               </button>
               <button className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-indigo-600/20 mt-2">
                 <Send className="w-4 h-4" /> Approve & Schedule
               </button>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
