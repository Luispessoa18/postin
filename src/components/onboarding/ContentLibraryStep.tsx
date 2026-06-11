import React, { useState } from 'react';
import { LibraryItem, SocialProfile } from '../../types';
import { normalizePosts, refreshPostsFromMeta, splitLibraryItems, mergeLibraryItems, readFilesAsLibraryItems, deleteUploadedImage } from '../../lib/social';
import { Image as ImageIcon, RefreshCw, Loader2, Package, Star } from 'lucide-react';

interface ContentLibraryStepProps {
  profile: SocialProfile | undefined;
  posts: LibraryItem[];
  onChange: (posts: LibraryItem[]) => void;
  tenantId: string;
  onContinue?: () => void;
  showContinue?: boolean;
}

type Tab = 'posts' | 'products';

function LibraryGrid({
  items,
  onRemove,
  onAdd,
  addLabel,
  showProductBadge,
  showLabelInput,
  onUpdateLabel,
  showReferenceToggle,
  onToggleReference,
}: {
  items: LibraryItem[];
  onRemove: (index: number) => void;
  onAdd: (files: File[], label?: string) => void;
  addLabel: string;
  showProductBadge?: boolean;
  showLabelInput?: boolean;
  onUpdateLabel?: (index: number, label: string) => void;
  showReferenceToggle?: boolean;
  onToggleReference?: (index: number) => void;
}) {
  const [pendingLabel, setPendingLabel] = useState('');

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((post, index) => (
        <div key={post.id || index} className="aspect-square bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative group">
          <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
          {showProductBadge && (
            <span className="absolute top-2 left-2 bg-amber-500/90 text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded">Produto</span>
          )}
          {showReferenceToggle && onToggleReference && (
            <button
              onClick={() => onToggleReference(index)}
              title={post.isReference ? 'Usado como referência para a IA' : 'Marcar como referência para a IA'}
              className={`absolute top-2 left-2 flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded transition-colors ${
                post.isReference ? 'bg-indigo-500/90 text-white' : 'bg-black/60 text-slate-300 opacity-0 group-hover:opacity-100'
              }`}
            >
              <Star className="w-3 h-3" fill={post.isReference ? 'currentColor' : 'none'} />
              Referência
            </button>
          )}
          {post.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-[10px] text-slate-200 line-clamp-2">{post.caption}</p>
              {(post.likes != null || post.comments != null) && (
                <p className="text-[10px] text-slate-400 mt-1">
                  {post.likes ?? 0} curtidas · {post.comments ?? 0} comentários
                </p>
              )}
            </div>
          )}
          {showLabelInput && onUpdateLabel && (
            <input
              type="text"
              value={post.label || ''}
              onChange={(e) => onUpdateLabel(index, e.target.value)}
              placeholder="Ex: Casa modelo A"
              className="absolute bottom-0 left-0 right-0 bg-black/80 text-[10px] text-white px-2 py-1 border-0 outline-none"
            />
          )}
          <button
            onClick={() => onRemove(index)}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      ))}

      <label className="aspect-square rounded-xl border-2 border-dashed border-slate-700 hover:border-indigo-500/50 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-indigo-400 cursor-pointer transition-colors">
        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
          const files = e.target.files ? [...e.target.files] : [];
          if (files.length) onAdd(files, pendingLabel || undefined);
          e.target.value = '';
        }} />
        <ImageIcon className="w-6 h-6" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-center px-2">{addLabel}</span>
        <span className="text-[9px] text-slate-600 text-center px-2">Várias fotos de uma vez</span>
      </label>
      {showLabelInput && (
        <div className="col-span-2 md:col-span-4">
          <input
            type="text"
            value={pendingLabel}
            onChange={(e) => setPendingLabel(e.target.value)}
            placeholder="Rótulo base para produtos (ex: Casa modelo A — numera automaticamente se várias fotos)"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200"
          />
        </div>
      )}
    </div>
  );
}

export function ContentLibraryStep({ profile, posts, onChange, tenantId, onContinue, showContinue = true }: ContentLibraryStepProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('posts');

  const { posts: postItems, products: productItems } = splitLibraryItems(normalizePosts(posts));

  const emitChange = (newPosts: LibraryItem[], newProducts: LibraryItem[]) => {
    onChange(mergeLibraryItems(newPosts, newProducts));
  };

  const handleRefresh = async () => {
    if (!profile) return;
    setRefreshing(true);
    setError(null);
    try {
      const fresh = await refreshPostsFromMeta(profile);
      emitChange(fresh, productItems);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  };

  const addPhotos = async (files: File[], kind: 'post' | 'product', label?: string) => {
    try {
      const newItems = await readFilesAsLibraryItems(files, kind, tenantId, {
        baseLabel: label,
        existingProductCount: productItems.length,
      });
      if (!newItems.length) return;
      if (kind === 'product') {
        emitChange(postItems, [...productItems, ...newItems]);
      } else {
        emitChange([...postItems, ...newItems], productItems);
      }
    } catch (e: any) {
      setError(e.message || 'Falha ao carregar imagens');
    }
  };

  const removePost = (index: number) => {
    deleteUploadedImage(postItems[index]?.imageUrl);
    emitChange(postItems.filter((_, i) => i !== index), productItems);
  };
  const removeProduct = (index: number) => {
    deleteUploadedImage(productItems[index]?.imageUrl);
    emitChange(postItems, productItems.filter((_, i) => i !== index));
  };

  const updateProductLabel = (index: number, label: string) => {
    const next = productItems.map((p, i) => i === index ? { ...p, label } : p);
    emitChange(postItems, next);
  };

  const toggleReference = (index: number) => {
    const next = postItems.map((p, i) => i === index ? { ...p, isReference: !p.isReference } : p);
    emitChange(next, productItems);
  };

  const totalCount = postItems.length + productItems.length;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-display font-bold mb-4 text-slate-200">Biblioteca de Conteúdo</h2>
        <p className="text-slate-400">
          Posts do Instagram, referências visuais e fotos reais de produto para a IA usar na geração.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
      )}

      <div className="flex gap-2 border-b border-slate-800">
        <button
          onClick={() => setTab('posts')}
          className={`px-4 py-2 text-sm font-bold border-b-2 -mb-px transition-colors ${tab === 'posts' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          Posts / Referências ({postItems.length})
        </button>
        <button
          onClick={() => setTab('products')}
          className={`px-4 py-2 text-sm font-bold border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${tab === 'products' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
        >
          <Package className="w-3.5 h-3.5" /> Fotos de produto ({productItems.length})
        </button>
      </div>

      {tab === 'posts' && (
        <>
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-400">{postItems.length} post(s) e referência(s)</p>
            <button
              onClick={handleRefresh}
              disabled={refreshing || !profile?.instagram}
              className="flex items-center gap-2 text-sm font-bold text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
            >
              {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Atualizar da Meta
            </button>
          </div>
          <p className="text-xs text-slate-500 -mt-2">
            Clique na <Star className="w-3 h-3 inline -mt-0.5" /> de uma imagem para que a IA a use como referência visual ao gerar novas artes.
          </p>
          <LibraryGrid
            items={postItems}
            onRemove={removePost}
            onAdd={(files) => addPhotos(files, 'post')}
            addLabel="Adicionar referências"
            showReferenceToggle
            onToggleReference={toggleReference}
          />
        </>
      )}

      {tab === 'products' && (
        <>
          <p className="text-sm text-slate-400">
            Fotos reais de produtos, imóveis ou serviços. A IA usará estas referências em vez de inventar.
          </p>
          <LibraryGrid
            items={productItems}
            onRemove={removeProduct}
            onAdd={(files, label) => addPhotos(files, 'product', label)}
            addLabel="Adicionar produtos"
            showProductBadge
            showLabelInput
            onUpdateLabel={updateProductLabel}
          />
        </>
      )}

      {showContinue && (
        <div className="flex justify-end pt-4">
          <button
            onClick={onContinue}
            disabled={totalCount === 0}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold transition-colors"
          >
            Continuar para Análise
          </button>
        </div>
      )}
    </div>
  );
}
