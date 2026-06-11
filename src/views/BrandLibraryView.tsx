import React, { useState } from 'react';
import { useAppStore } from '../store/AppContext';
import { Palette, Type, Image as ImageIcon, Package, Star } from 'lucide-react';
import { LibraryItem } from '../types';
import { normalizePosts, buildBrandLibrary, splitLibraryItems, readFilesAsLibraryItems, deleteUploadedImage } from '../lib/social';
import { migrateBrandColors } from '../lib/brandColors';

export function BrandLibraryView() {
  const { state, setBrand } = useAppStore();
  const [tab, setTab] = useState<'posts' | 'products'>('posts');

  if (!state.brand) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-200 mb-4">Biblioteca de Marca</h1>
        <p className="text-lg text-slate-400 mb-8">Complete a configuração para acessar sua biblioteca.</p>
      </div>
    );
  }

  const colors = migrateBrandColors(state.brand.colors);
  const { fonts } = state.brand;
  const items = normalizePosts(
    state.brand.contentLibrary?.length
      ? state.brand.contentLibrary
      : state.brand.productPhotos?.map((url, i) => ({ id: `lib-${i}`, imageUrl: url }))
  );
  const { posts, products } = splitLibraryItems(items);

  const updateItems = (newItems: LibraryItem[]) => {
    const library = buildBrandLibrary(newItems);
    setBrand({
      ...state.brand!,
      contentLibrary: library.contentLibrary,
      productPhotos: library.productPhotos,
    });
  };

  const removeItem = (kind: 'post' | 'product', index: number) => {
    if (kind === 'post') {
      deleteUploadedImage(posts[index]?.imageUrl);
      updateItems([...posts.filter((_, i) => i !== index), ...products]);
    } else {
      deleteUploadedImage(products[index]?.imageUrl);
      updateItems([...posts, ...products.filter((_, i) => i !== index)]);
    }
  };

  const toggleReference = (index: number) => {
    const next = posts.map((p, i) => i === index ? { ...p, isReference: !p.isReference } : p);
    updateItems([...next, ...products]);
  };

  const addItems = async (files: File[], kind: 'post' | 'product') => {
    const newItems = await readFilesAsLibraryItems(files, kind, state.tenantId, {
      existingProductCount: products.length,
    });
    if (!newItems.length) return;
    updateItems(kind === 'product' ? [...posts, ...products, ...newItems] : [...posts, ...newItems, ...products]);
  };

  const displayItems = tab === 'posts' ? posts : products;

  return (
    <div className="p-8 pb-32">
      <header className="mb-8 border-b border-slate-800 pb-6">
        <h1 className="text-3xl font-display font-bold text-slate-200">Biblioteca de Marca</h1>
        <p className="text-slate-400 mt-1">Assets que alimentam a geração de conteúdo por IA</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <Palette className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-lg text-slate-200">Cores</h3>
          </div>
          <div className="space-y-4">
            {colors.map((color, index) => (
              <div key={`${color}-${index}`}>
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">
                  {index === 0 ? 'Primária' : index === 1 ? 'Secundária' : index === 2 ? 'Destaque' : `Cor ${index + 1}`}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg border border-slate-800" style={{ backgroundColor: color }} />
                  <span className="font-mono text-sm text-slate-300">{color}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <Type className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-lg text-slate-200">Tipografia</h3>
          </div>
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Títulos</p>
              <p className="text-4xl font-display font-bold text-slate-200">{fonts?.heading || 'Space Grotesk'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Corpo</p>
              <p className="text-lg text-slate-400">{fonts?.body || 'Inter'}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 col-span-1 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-lg text-slate-200">Biblioteca</h3>
          </div>

          <div className="flex gap-2 mb-4 border-b border-slate-800">
            <button
              onClick={() => setTab('posts')}
              className={`px-3 py-1.5 text-xs font-bold border-b-2 -mb-px ${tab === 'posts' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500'}`}
            >
              Posts ({posts.length})
            </button>
            <button
              onClick={() => setTab('products')}
              className={`px-3 py-1.5 text-xs font-bold border-b-2 -mb-px flex items-center gap-1 ${tab === 'products' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-500'}`}
            >
              <Package className="w-3 h-3" /> Produtos ({products.length})
            </button>
          </div>

          {tab === 'posts' && (
            <p className="text-[10px] text-slate-500 mb-3">
              Clique na <Star className="w-2.5 h-2.5 inline -mt-0.5" /> para usar como referência visual da IA.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 mb-4">
            {displayItems.map((photo, index) => (
              <div key={photo.id || index} className="aspect-square bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative group">
                <img src={photo.imageUrl} alt="" className="w-full h-full object-cover" />
                {photo.kind === 'product' && (
                  <span className="absolute top-1 left-1 bg-amber-500/90 text-white text-[8px] font-bold uppercase px-1 rounded">Produto</span>
                )}
                {tab === 'posts' && (
                  <button
                    onClick={() => toggleReference(index)}
                    title={photo.isReference ? 'Usado como referência para a IA' : 'Marcar como referência para a IA'}
                    className={`absolute top-1 left-1 flex items-center gap-0.5 text-[8px] font-bold uppercase px-1 rounded transition-colors ${
                      photo.isReference ? 'bg-indigo-500/90 text-white' : 'bg-black/60 text-slate-300 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <Star className="w-2.5 h-2.5" fill={photo.isReference ? 'currentColor' : 'none'} />
                  </button>
                )}
                {photo.label && (
                  <p className="absolute bottom-0 left-0 right-0 bg-black/70 text-[9px] text-white px-1 py-0.5 truncate">{photo.label}</p>
                )}
                <button
                  onClick={() => removeItem(tab === 'posts' ? 'post' : 'product', index)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
              </div>
            ))}
            <label className="aspect-square rounded-xl border-2 border-dashed border-slate-700 hover:border-indigo-500/50 flex flex-col items-center justify-center cursor-pointer text-slate-500 hover:text-indigo-400">
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
                const files = e.target.files ? [...e.target.files] : [];
                if (files.length) addItems(files, tab === 'posts' ? 'post' : 'product');
                e.target.value = '';
              }} />
              <ImageIcon className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-bold uppercase">Adicionar</span>
              <span className="text-[8px] text-slate-600 mt-1">Várias fotos</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
