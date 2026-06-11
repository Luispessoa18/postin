export interface InstagramPostRaw {
  id: string;
  imageUrl: string;
  caption?: string;
  likes?: number;
  comments?: number;
  timestamp?: string;
  mediaType?: string;
}

export function parseInstagramMedia(mediaData: any[]): InstagramPostRaw[] {
  return (mediaData || []).map((m: any) => ({
    id: m.id,
    imageUrl: m.thumbnail_url || m.media_url,
    caption: m.caption || undefined,
    likes: m.like_count ?? undefined,
    comments: m.comments_count ?? undefined,
    timestamp: m.timestamp || undefined,
    mediaType: m.media_type || undefined,
  })).filter((p) => p.imageUrl);
}

export function parseFacebookPage(page: any): any {
  const ig = page.instagram_business_account;
  const recentPosts = ig?.media?.data ? parseInstagramMedia(ig.media.data) : [];

  return {
    id: page.id,
    name: page.name,
    about: page.about || page.description || null,
    category: page.category || null,
    pageAccessToken: page.access_token || null,
    instagramAccountId: ig?.id || null,
    facebook: {
      handle: page.name,
      followers: page.followers_count || 0,
      pictureUrl: page.picture?.data?.url || null,
    },
    instagram: ig ? {
      handle: '@' + ig.username,
      followers: ig.followers_count || 0,
      pictureUrl: ig.profile_picture_url || null,
      biography: ig.biography || null,
      recentPosts,
      pageAccessToken: page.access_token || null,
      accountId: ig.id,
    } : undefined,
  };
}

export async function fetchInstagramPosts(
  pageAccessToken: string,
  instagramAccountId: string,
  limit = 25
): Promise<InstagramPostRaw[]> {
  const fields = 'id,caption,media_type,timestamp,like_count,comments_count,media_url,thumbnail_url';
  const url = `https://graph.facebook.com/v19.0/${instagramAccountId}/media?fields=${fields}&limit=${limit}&access_token=${pageAccessToken}`;
  const response = await fetch(url);
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || 'Erro ao buscar posts do Instagram');
  }
  return parseInstagramMedia(data.data || []);
}

export const META_ACCOUNTS_FIELDS = [
  'id',
  'name',
  'followers_count',
  'about',
  'description',
  'category',
  'access_token',
  'picture.type(large){url}',
  'instagram_business_account{id,username,followers_count,profile_picture_url,biography,media.limit(25){id,caption,media_type,timestamp,like_count,comments_count,media_url,thumbnail_url}}',
].join(',');

export function buildMockProfiles(): any[] {
  const mockPosts = [
    { id: 'm1', imageUrl: 'https://images.unsplash.com/photo-1583394838002-cd9a239bdf5e?auto=format&fit=crop&q=80&w=400&h=400', caption: 'Novo lançamento da coleção', likes: 342, comments: 28, mediaType: 'IMAGE' },
    { id: 'm2', imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400&h=400', caption: 'Bastidores do estúdio', likes: 189, comments: 12, mediaType: 'IMAGE' },
    { id: 'm3', imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3fb0ee1?auto=format&fit=crop&q=80&w=400&h=400', caption: 'Dica do dia para engajamento', likes: 521, comments: 45, mediaType: 'IMAGE' },
    { id: 'm4', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=400&h=400', caption: 'Depoimento de cliente', likes: 276, comments: 19, mediaType: 'IMAGE' },
  ];

  return [{
    id: 'mock-1',
    name: 'TechGear Mock',
    about: 'Equipamentos tech inovadores para todos.',
    category: 'Technology',
    pageAccessToken: 'mock-token',
    instagramAccountId: 'mock-ig-1',
    facebook: { handle: 'TechGear', followers: 15400, pictureUrl: 'https://images.unsplash.com/photo-1542382156909-9237192171af?auto=format&fit=crop&q=80&w=200&h=200' },
    instagram: {
      handle: '@techgear_mock',
      followers: 24500,
      biography: 'Tech enthusiast. Gadgets & Gear.',
      pictureUrl: 'https://images.unsplash.com/photo-1542382156909-9237192171af?auto=format&fit=crop&q=80&w=200&h=200',
      recentPosts: mockPosts,
      pageAccessToken: 'mock-token',
      accountId: 'mock-ig-1',
    },
  }];
}
