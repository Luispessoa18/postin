export type AIProvider = 'gemini' | 'openai';
export type AITask = 'text' | 'image';

export interface ResolvedProviderConfig {
  provider: AIProvider;
  model: string;
  apiKey: string;
}

export interface TextGenerateOptions {
  jsonMode?: boolean;
}

export interface ImageGenerateResult {
  imageUrl: string;
  refinedPrompt: string;
}

export interface ImageReference {
  data: string;
  mimeType: string;
}

export type ImageAspectRatio = '1:1' | '9:16';

export const TEXT_MODELS: Record<AIProvider, { id: string; label: string }[]> = {
  gemini: [
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  ],
  openai: [
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { id: 'gpt-4o', label: 'GPT-4o' },
  ],
};

export const IMAGE_MODELS: Record<AIProvider, { id: string; label: string }[]> = {
  gemini: [
    { id: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash Image' },
  ],
  openai: [
    { id: 'dall-e-3', label: 'DALL-E 3' },
    { id: 'gpt-image-1', label: 'GPT Image 1' },
  ],
};
