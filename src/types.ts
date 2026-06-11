export type ViewState = 
  | 'dashboard'
  | 'onboarding'
  | 'brand_library'
  | 'strategy'
  | 'calendar'
  | 'approvals'
  | 'analytics'
  | 'settings'
  | 'image_generator';

export type AdminViewState =
  | 'admin_dashboard'
  | 'admin_tenants'
  | 'admin_platform_ai'
  | 'admin_integrations'
  | 'admin_usage';

export type AppMode = 'app' | 'admin';

export type AIProvider = 'gemini' | 'openai';

export interface AISettings {
  tenantId: string;
  usePlatformKeys: boolean;
  geminiApiKey: string;
  openaiApiKey: string;
  hasGeminiKey: boolean;
  hasOpenaiKey: boolean;
  textProvider: AIProvider;
  textModel: string;
  imageProvider: AIProvider;
  imageModel: string;
}

export interface ModelOption {
  id: string;
  label: string;
}

export interface AvailableModels {
  text: Record<AIProvider, ModelOption[]>;
  image: Record<AIProvider, ModelOption[]>;
}

export interface Tenant {
  id: string;
  name: string;
  plan: 'basic' | 'pro' | 'agency';
  status: 'active' | 'suspended' | 'trial';
  created_at: string;
}

export interface AdminStats {
  totalTenants: number;
  activeTenants: number;
  usageToday: number;
  usageByProvider: { provider: string; count: number }[];
}

export interface UsageLog {
  id: number;
  tenant_id: string | null;
  operation: string;
  provider: string;
  model: string;
  created_at: string;
}

export interface Brand {
  id: string;
  name: string;
  segment: string;
  subSegment: string;
  city: string;
  website: string;
  whatsapp: string;
  about?: string;
  logoUrl?: string;
  logoUrlTransparent?: string;
  logoUrlLight?: string;
  logoUrlDark?: string;
  colors: string[];
  fonts: {
    heading: string;
    body: string;
  };
  productPhotos?: string[];
  contentLibrary?: LibraryItem[];
}

export interface LibraryItem {
  id: string;
  imageUrl: string;
  kind?: 'post' | 'product';
  caption?: string;
  label?: string;
  likes?: number;
  comments?: number;
  timestamp?: string;
  mediaType?: string;
  /** Whether this item should be sent to the AI as a visual reference when generating images. */
  isReference?: boolean;
}

/** @deprecated Use LibraryItem */
export type InstagramPost = LibraryItem;

export interface SocialProfile {
  id: string;
  name: string;
  about?: string;
  category?: string;
  pageAccessToken?: string;
  instagramAccountId?: string;
  facebook?: {
    handle: string;
    followers: number;
    pictureUrl?: string;
  };
  instagram?: {
    handle: string;
    followers: number;
    pictureUrl?: string;
    biography?: string;
    recentPosts?: InstagramPost[];
    pageAccessToken?: string;
    accountId?: string;
  };
}

export interface ContentPillar {
  name: string;
  percentage: number;
  description: string;
}

export interface Post {
  id: string;
  theme: string;
  pilar: string;
  objective: string;
  cta: string;
  platform: string;
  format: 'post' | 'carousel' | 'story' | 'reels';
  date: Date;
  status: 'idea' | 'generating' | 'draft' | 'review' | 'approved' | 'scheduled' | 'published';
  copy?: {
    headline: string;
    body: string;
    hashtags: string[];
  };
  prompt?: string;
  imageUrl?: string;
  storyImageUrl?: string;
}

export interface AnalysisInsights {
  whatWorks: string[];
  whatDoesntWork: string[];
  idealFrequency: string;
  idealTimes: string[];
  topThemes: string[];
  suggestions: string[];
}

export interface AppState {
  currentView: ViewState;
  adminView: AdminViewState;
  appMode: AppMode;
  tenantId: string;
  onboardingStage: number;
  brand: Brand | null;
  socialProfiles: SocialProfile[];
  pillars: ContentPillar[];
  posts: Post[];
  insights: AnalysisInsights | null;
  isProcessingAI: boolean;
  plan: 'basic' | 'pro' | 'agency';
  adminApiKey: string;
  adminUsername: string;
  adminLoggedIn: boolean;
}
