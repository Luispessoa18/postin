import React, { useState } from 'react';
import { X, Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ThumbsUp, Share2, Globe, Repeat2 } from 'lucide-react';
import { Post, Brand } from '../types';

type PreviewPlatform = 'instagram' | 'facebook' | 'linkedin';

interface PostPreviewModalProps {
  post: Post;
  brand: Brand | null;
  onClose: () => void;
}

const PLATFORM_LABELS: Record<PreviewPlatform, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
};

function Avatar({ brand }: { brand: Brand | null }) {
  const logo = brand?.logoUrlTransparent || brand?.logoUrl;
  if (logo) {
    return <img src={logo} alt={brand?.name} className="w-9 h-9 rounded-full object-cover bg-slate-200 flex-shrink-0" />;
  }
  return (
    <div className="w-9 h-9 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
      {(brand?.name || 'M')[0].toUpperCase()}
    </div>
  );
}

function InstagramMockup({ post, brand }: { post: Post; brand: Brand | null }) {
  const headline = post.copy?.headline || post.theme;
  const body = post.copy?.body || '';
  const hashtags = post.copy?.hashtags || [];

  return (
    <div className="bg-white rounded-xl overflow-hidden text-black">
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <Avatar brand={brand} />
          <span className="font-semibold text-sm">{brand?.name || 'sua_marca'}</span>
        </div>
        <MoreHorizontal className="w-5 h-5" />
      </div>
      <div className="aspect-square bg-slate-100">
        {post.imageUrl && <img src={post.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
      </div>
      <div className="px-3 pt-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Heart className="w-6 h-6" />
          <MessageCircle className="w-6 h-6" />
          <Send className="w-6 h-6" />
        </div>
        <Bookmark className="w-6 h-6" />
      </div>
      <div className="px-3 pt-2 pb-3 text-sm">
        <p className="font-semibold">1.204 curtidas</p>
        <p className="mt-1">
          <span className="font-semibold mr-1">{brand?.name || 'sua_marca'}</span>
          {headline && <span className="font-semibold">{headline} </span>}
          {body}
        </p>
        {hashtags.length > 0 && (
          <p className="text-blue-900 mt-1">{hashtags.join(' ')}</p>
        )}
        <p className="text-slate-400 text-xs mt-2 uppercase tracking-wide">Há 2 horas</p>
      </div>
    </div>
  );
}

function FacebookMockup({ post, brand }: { post: Post; brand: Brand | null }) {
  const headline = post.copy?.headline || post.theme;
  const body = post.copy?.body || '';
  const hashtags = post.copy?.hashtags || [];

  return (
    <div className="bg-white rounded-xl overflow-hidden text-black">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <Avatar brand={brand} />
        <div>
          <p className="font-semibold text-sm leading-tight">{brand?.name || 'Sua Marca'}</p>
          <p className="text-xs text-slate-500 flex items-center gap-1">2 h · <Globe className="w-3 h-3" /></p>
        </div>
      </div>
      <div className="px-3 pb-2 text-sm">
        {headline && <p className="font-semibold">{headline}</p>}
        {body && <p className="mt-1">{body}</p>}
        {hashtags.length > 0 && <p className="text-blue-700 mt-1">{hashtags.join(' ')}</p>}
      </div>
      <div className="aspect-square bg-slate-100">
        {post.imageUrl && <img src={post.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
      </div>
      <div className="px-3 py-2 flex items-center justify-between text-xs text-slate-500 border-b border-slate-100">
        <span>👍❤️ 248</span>
        <span>36 comentários · 12 compartilhamentos</span>
      </div>
      <div className="px-3 py-1 flex items-center justify-around text-sm text-slate-600 font-semibold">
        <span className="flex items-center gap-2 py-1.5"><ThumbsUp className="w-4 h-4" /> Curtir</span>
        <span className="flex items-center gap-2 py-1.5"><MessageCircle className="w-4 h-4" /> Comentar</span>
        <span className="flex items-center gap-2 py-1.5"><Share2 className="w-4 h-4" /> Compartilhar</span>
      </div>
    </div>
  );
}

function LinkedinMockup({ post, brand }: { post: Post; brand: Brand | null }) {
  const headline = post.copy?.headline || post.theme;
  const body = post.copy?.body || '';
  const hashtags = post.copy?.hashtags || [];

  return (
    <div className="bg-white rounded-xl overflow-hidden text-black">
      <div className="flex items-start gap-2.5 px-3 py-2.5">
        <Avatar brand={brand} />
        <div className="flex-1">
          <p className="font-semibold text-sm leading-tight">{brand?.name || 'Sua Marca'}</p>
          <p className="text-xs text-slate-500 leading-tight">{brand?.segment || 'Empresa'}</p>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">2 h · <Globe className="w-3 h-3" /></p>
        </div>
        <MoreHorizontal className="w-5 h-5 text-slate-500" />
      </div>
      <div className="px-3 pb-2 text-sm">
        {headline && <p className="font-semibold">{headline}</p>}
        {body && <p className="mt-1 whitespace-pre-line">{body}</p>}
        {hashtags.length > 0 && <p className="text-blue-700 mt-1">{hashtags.join(' ')}</p>}
      </div>
      <div className="bg-slate-100">
        {post.imageUrl && <img src={post.imageUrl} alt="" className="w-full h-auto object-cover" referrerPolicy="no-referrer" />}
      </div>
      <div className="px-3 py-2 flex items-center justify-around text-sm text-slate-600 font-semibold border-t border-slate-100">
        <span className="flex items-center gap-2 py-1.5"><ThumbsUp className="w-4 h-4" /> Gostei</span>
        <span className="flex items-center gap-2 py-1.5"><MessageCircle className="w-4 h-4" /> Comentar</span>
        <span className="flex items-center gap-2 py-1.5"><Repeat2 className="w-4 h-4" /> Compartilhar</span>
        <span className="flex items-center gap-2 py-1.5"><Send className="w-4 h-4" /> Enviar</span>
      </div>
    </div>
  );
}

export function PostPreviewModal({ post, brand, onClose }: PostPreviewModalProps) {
  const initialPlatform: PreviewPlatform = (['instagram', 'facebook', 'linkedin'] as const).includes(post.platform as PreviewPlatform)
    ? (post.platform as PreviewPlatform)
    : 'instagram';
  const [platform, setPlatform] = useState<PreviewPlatform>(initialPlatform);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex gap-1.5">
            {(Object.keys(PLATFORM_LABELS) as PreviewPlatform[]).map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  platform === p ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {PLATFORM_LABELS[p]}
              </button>
            ))}
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          {platform === 'instagram' && <InstagramMockup post={post} brand={brand} />}
          {platform === 'facebook' && <FacebookMockup post={post} brand={brand} />}
          {platform === 'linkedin' && <LinkedinMockup post={post} brand={brand} />}
        </div>
      </div>
    </div>
  );
}
