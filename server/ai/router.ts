import * as gemini from './gemini.js';
import * as openai from './openai.js';
import { resolveAIConfig, logUsage } from '../db/index.js';
import type { ImageAspectRatio, ImageGenerateResult, ImageReference, TextGenerateOptions } from './types.js';

function getApiKey(config: ReturnType<typeof resolveAIConfig>): string {
  const key = config.provider === 'gemini' ? config.geminiKey : config.openaiKey;
  if (!key) {
    throw new Error(`API key not configured for provider: ${config.provider}`);
  }
  return key;
}

export async function generateText(
  tenantId: string | undefined,
  operation: string,
  prompt: string,
  options?: TextGenerateOptions
): Promise<string> {
  const config = resolveAIConfig(tenantId, 'text');
  const apiKey = getApiKey(config);

  let result: string;
  if (config.provider === 'gemini') {
    result = await gemini.generateText(apiKey, config.model, prompt, options);
  } else {
    result = await openai.generateText(apiKey, config.model, prompt, options);
  }

  logUsage(tenantId, operation, config.provider, config.model);
  return result;
}

export async function generateImage(
  tenantId: string | undefined,
  operation: string,
  prompt: string,
  references?: ImageReference[],
  aspectRatio?: ImageAspectRatio
): Promise<ImageGenerateResult> {
  const config = resolveAIConfig(tenantId, 'image');
  const apiKey = getApiKey(config);

  let result: ImageGenerateResult;
  if (config.provider === 'gemini') {
    result = await gemini.generateImage(apiKey, config.model, prompt, references, aspectRatio);
  } else {
    result = await openai.generateImage(apiKey, config.model, prompt, references, aspectRatio);
  }

  logUsage(tenantId, operation, config.provider, config.model);
  return result;
}
