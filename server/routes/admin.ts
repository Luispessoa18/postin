import { Router, Request, Response, NextFunction } from 'express';
import {
  getAllTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
  getPlatformConfig,
  updatePlatformConfig,
  getAdminStats,
  getUsageLogs,
  maskKey,
} from '../db/index.js';
import {
  getIntegrationsForAdmin,
  updatePlatformIntegrations,
  getPlatformIntegrationsRow,
} from '../db/integrations.js';
import {
  startCloudflareTunnel,
  stopCloudflareTunnel,
  getTunnelStatus,
} from '../services/cloudflareTunnel.js';
import { TEXT_MODELS, IMAGE_MODELS } from '../ai/types.js';

const router = Router();

function getAdminToken(): string {
  return process.env.ADMIN_API_KEY || 'dev-admin-token';
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const provided = req.headers['x-admin-key'];
  if (provided === getAdminToken()) {
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized' });
}

router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  const expectedUser = process.env.ADMIN_USER || 'admin';
  const expectedPass = process.env.ADMIN_PASSWORD || 'admin123';
  const token = getAdminToken();

  if (username === expectedUser && password === expectedPass) {
    return res.json({ token, username: expectedUser });
  }

  return res.status(401).json({ error: 'Usuário ou senha inválidos' });
});

router.use(requireAdmin);

router.get('/stats', (_req: Request, res: Response) => {
  try {
    res.json(getAdminStats());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/usage', (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    res.json(getUsageLogs(limit, offset));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/tenants', (_req: Request, res: Response) => {
  try {
    res.json(getAllTenants());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/tenants/:id', (req: Request, res: Response) => {
  try {
    const tenant = getTenantById(req.params.id);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    res.json(tenant);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/tenants', (req: Request, res: Response) => {
  try {
    const { name, plan, status } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const tenant = createTenant({ name, plan, status });
    res.status(201).json(tenant);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/tenants/:id', (req: Request, res: Response) => {
  try {
    const tenant = updateTenant(req.params.id, req.body);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    res.json(tenant);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/tenants/:id', (req: Request, res: Response) => {
  try {
    const deleted = deleteTenant(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Tenant not found' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/platform/ai', (_req: Request, res: Response) => {
  try {
    const config = getPlatformConfig();
    res.json({
      geminiApiKey: config.gemini_key ? maskKey(config.gemini_key) : '',
      openaiApiKey: config.openai_key ? maskKey(config.openai_key) : '',
      hasGeminiKey: !!config.gemini_key,
      hasOpenaiKey: !!config.openai_key,
      textProvider: config.text_provider,
      textModel: config.text_model,
      imageProvider: config.image_provider,
      imageModel: config.image_model,
      availableModels: { text: TEXT_MODELS, image: IMAGE_MODELS },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/platform/ai', (req: Request, res: Response) => {
  try {
    const {
      geminiApiKey,
      openaiApiKey,
      textProvider,
      textModel,
      imageProvider,
      imageModel,
    } = req.body;

    const current = getPlatformConfig();
    const updates: Parameters<typeof updatePlatformConfig>[0] = {
      text_provider: textProvider,
      text_model: textModel,
      image_provider: imageProvider,
      image_model: imageModel,
    };

    if (geminiApiKey && !geminiApiKey.includes('••••')) {
      updates.gemini_key = geminiApiKey;
    } else {
      updates.gemini_key = current.gemini_key;
    }

    if (openaiApiKey && !openaiApiKey.includes('••••')) {
      updates.openai_key = openaiApiKey;
    } else {
      updates.openai_key = current.openai_key;
    }

    updatePlatformConfig(updates);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/integrations', (_req: Request, res: Response) => {
  try {
    res.json(getIntegrationsForAdmin());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/integrations', (req: Request, res: Response) => {
  try {
    const { facebookAppId, facebookAppSecret, appUrl } = req.body;
    const current = getPlatformIntegrationsRow();
    const updates: Parameters<typeof updatePlatformIntegrations>[0] = {};

    if (facebookAppId !== undefined) updates.facebook_app_id = facebookAppId || null;
    if (appUrl !== undefined) updates.app_url = appUrl || null;
    if (facebookAppSecret && !facebookAppSecret.includes('••••')) {
      updates.facebook_app_secret = facebookAppSecret;
    } else if (facebookAppSecret === '') {
      updates.facebook_app_secret = null;
    } else {
      updates.facebook_app_secret = current.facebook_app_secret;
    }

    updatePlatformIntegrations(updates);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/integrations/tunnel/status', (_req: Request, res: Response) => {
  try {
    const status = getTunnelStatus();
    const row = getPlatformIntegrationsRow();
    res.json({
      running: status.running,
      url: status.url || row.app_url,
      oauthRedirectUri: row.app_url ? `${row.app_url.replace(/\/$/, '')}/api/auth/facebook/callback` : '',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/integrations/tunnel/start', async (req: Request, res: Response) => {
  try {
    const port = parseInt(
      String(req.app.get('port') || process.env.PORT || '3080'),
      10
    );
    const url = await startCloudflareTunnel(port);
    return res.json({
      url,
      oauthRedirectUri: `${url.replace(/\/$/, '')}/api/auth/facebook/callback`,
    });
  } catch (err: any) {
    console.error('Tunnel start error:', err);
    return res.status(500).json({ error: err.message || 'Falha ao iniciar tunnel' });
  }
});

router.post('/integrations/tunnel/stop', (_req: Request, res: Response) => {
  try {
    stopCloudflareTunnel();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
