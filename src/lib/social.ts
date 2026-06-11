import { LibraryItem } from '../types';

export function productPhotoUrls(posts: LibraryItem[]): string[] {
  return posts.filter(p => p.kind === 'product').map(p => p.imageUrl);
}

/** @deprecated Use productPhotoUrls */
export function postsToPhotoUrls(posts: LibraryItem[]): string[] {
  return productPhotoUrls(posts);
}

export function splitLibraryItems(items: LibraryItem[]): { posts: LibraryItem[]; products: LibraryItem[] } {
  const posts = items.filter(i => i.kind !== 'product');
  const products = items.filter(i => i.kind === 'product');
  return { posts, products };
}

export function mergeLibraryItems(posts: LibraryItem[], products: LibraryItem[]): LibraryItem[] {
  return [...posts.map(p => ({ ...p, kind: 'post' as const })), ...products.map(p => ({ ...p, kind: 'product' as const }))];
}

export function normalizePosts(posts: (LibraryItem | string)[] | undefined): LibraryItem[] {
  if (!posts) return [];
  return posts.map((p, i) => {
    if (typeof p === 'string') {
      return { id: `legacy-${i}`, imageUrl: p, kind: 'post' };
    }
    return { ...p, kind: p.kind || 'post' };
  });
}

export function migrateLibraryItem(item: LibraryItem): LibraryItem {
  return { ...item, kind: item.kind || 'post' };
}

export async function refreshPostsFromMeta(profile: {
  instagram?: { pageAccessToken?: string; accountId?: string };
  pageAccessToken?: string;
  instagramAccountId?: string;
}): Promise<LibraryItem[]> {
  const token = profile.instagram?.pageAccessToken || profile.pageAccessToken;
  const accountId = profile.instagram?.accountId || profile.instagramAccountId;
  if (!token || !accountId) throw new Error('Perfil sem credenciais Meta para atualizar posts');

  const res = await fetch('/api/social/refresh-posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pageAccessToken: token, instagramAccountId: accountId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Falha ao atualizar posts');
  return (data.posts as LibraryItem[]).map(p => ({ ...p, kind: 'post' as const }));
}

export function initContentLibraryFromProfile(profile: {
  instagram?: { recentPosts?: LibraryItem[] };
} | undefined): LibraryItem[] {
  return normalizePosts(profile?.instagram?.recentPosts).map(p => ({ ...p, kind: 'post' as const }));
}

export function buildBrandLibrary(merged: LibraryItem[]): { contentLibrary: LibraryItem[]; productPhotos: string[] } {
  return {
    contentLibrary: merged,
    productPhotos: productPhotoUrls(merged),
  };
}

/** Reads a File as a base64 data URL. */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** Uploads an image file to the server, persisted under data/uploads/<tenantId>/<category>/. Returns its URL. */
export async function uploadImageFile(file: File, tenantId: string, category: string): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file);
  const res = await fetch('/api/uploads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenantId, category, dataUrl }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Falha ao enviar imagem');
  return data.url as string;
}

/** Best-effort removal of a previously uploaded image. No-ops for non-server URLs. */
export async function deleteUploadedImage(url: string | undefined): Promise<void> {
  if (!url || !url.startsWith('/uploads/')) return;
  try {
    await fetch('/api/uploads', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
  } catch {
    // best-effort cleanup
  }
}

export async function readFilesAsLibraryItems(
  files: File[],
  kind: 'post' | 'product',
  tenantId: string,
  options?: { baseLabel?: string; existingProductCount?: number }
): Promise<LibraryItem[]> {
  const imageFiles = files.filter(f => f.type.startsWith('image/'));
  if (!imageFiles.length) return [];

  const category = kind === 'product' ? 'products' : 'references';

  return Promise.all(
    imageFiles.map(async (file, i) => {
      const baseLabel = options?.baseLabel?.trim();
      let label: string | undefined;
      if (kind === 'product') {
        if (baseLabel) {
          label = imageFiles.length > 1 ? `${baseLabel} ${i + 1}` : baseLabel;
        } else {
          const n = (options?.existingProductCount ?? 0) + i + 1;
          label = `Produto ${n}`;
        }
      }
      const imageUrl = await uploadImageFile(file, tenantId, category);
      return {
        id: `upload-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
        imageUrl,
        kind,
        label,
        isReference: kind === 'post' ? true : undefined,
      };
    })
  );
}
