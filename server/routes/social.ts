import { Router, Request, Response } from 'express';
import { fetchInstagramPosts } from '../services/metaApi.js';

const router = Router();

router.post('/refresh-posts', async (req: Request, res: Response) => {
  try {
    const { pageAccessToken, instagramAccountId } = req.body;

    if (!pageAccessToken || !instagramAccountId) {
      return res.status(400).json({ error: 'pageAccessToken e instagramAccountId são obrigatórios' });
    }

    if (pageAccessToken === 'mock-token') {
      const { buildMockProfiles } = await import('../services/metaApi.js');
      const mock = buildMockProfiles()[0];
      return res.json({ posts: mock.instagram.recentPosts });
    }

    const posts = await fetchInstagramPosts(pageAccessToken, instagramAccountId);
    res.json({ posts });
  } catch (err: any) {
    console.error('Refresh posts error:', err);
    res.status(500).json({ error: err.message || 'Falha ao atualizar posts' });
  }
});

export default router;
