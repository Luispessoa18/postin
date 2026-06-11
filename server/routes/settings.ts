import { Router, Request, Response } from 'express';
import {
  DEMO_TENANT_ID,
  getTenantOverride,
  upsertTenantOverride,
  getPlatformConfig,
  maskKey,
  getTenantById,
} from '../db/index.js';
import { TEXT_MODELS, IMAGE_MODELS } from '../ai/types.js';

const router = Router();

function getTenantId(req: Request): string {
  return (req.query.tenantId as string) || (req.body?.tenantId as string) || DEMO_TENANT_ID;
}

router.get('/ai', (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const tenant = getTenantById(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const platform = getPlatformConfig();
    const override = getTenantOverride(tenantId);
    const usePlatformKeys = !override || override.use_platform_keys === 1;

    res.json({
      tenantId,
      usePlatformKeys,
      geminiApiKey: usePlatformKeys ? (platform.gemini_key ? maskKey(platform.gemini_key) : '') : (override?.gemini_key ? maskKey(override.gemini_key) : ''),
      openaiApiKey: usePlatformKeys ? (platform.openai_key ? maskKey(platform.openai_key) : '') : (override?.openai_key ? maskKey(override.openai_key) : ''),
      hasGeminiKey: usePlatformKeys ? !!platform.gemini_key : !!override?.gemini_key,
      hasOpenaiKey: usePlatformKeys ? !!platform.openai_key : !!override?.openai_key,
      textProvider: usePlatformKeys ? platform.text_provider : (override?.text_provider ?? platform.text_provider),
      textModel: usePlatformKeys ? platform.text_model : (override?.text_model ?? platform.text_model),
      imageProvider: usePlatformKeys ? platform.image_provider : (override?.image_provider ?? platform.image_provider),
      imageModel: usePlatformKeys ? platform.image_model : (override?.image_model ?? platform.image_model),
      availableModels: { text: TEXT_MODELS, image: IMAGE_MODELS },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/ai', (req: Request, res: Response) => {
  try {
    const tenantId = getTenantId(req);
    const tenant = getTenantById(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const {
      usePlatformKeys,
      geminiApiKey,
      openaiApiKey,
      textProvider,
      textModel,
      imageProvider,
      imageModel,
    } = req.body;

    const existing = getTenantOverride(tenantId);
    const updates: Parameters<typeof upsertTenantOverride>[1] = {
      use_platform_keys: usePlatformKeys,
      text_provider: textProvider,
      text_model: textModel,
      image_provider: imageProvider,
      image_model: imageModel,
    };

    if (geminiApiKey && !geminiApiKey.includes('••••')) {
      updates.gemini_key = geminiApiKey;
    } else if (existing?.gemini_key) {
      updates.gemini_key = existing.gemini_key;
    }

    if (openaiApiKey && !openaiApiKey.includes('••••')) {
      updates.openai_key = openaiApiKey;
    } else if (existing?.openai_key) {
      updates.openai_key = existing.openai_key;
    }

    upsertTenantOverride(tenantId, updates);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
