import React, { createContext, useContext, useState, ReactNode } from 'react';
import { migrateBrandColors } from '../lib/brandColors';
import { AppState, Brand, ContentPillar, Post, SocialProfile, ViewState, AnalysisInsights, AdminViewState, AppMode } from '../types';

export interface StrategyPlan {
  voiceAndTone: string[];
  elevatorPitch: string;
  keywords: string[];
}

interface ExtendedAppState extends AppState {
  strategyPlan?: StrategyPlan;
}

interface AppContextProps {
  state: ExtendedAppState;
  setViewState: (view: ViewState) => void;
  setAdminView: (view: AdminViewState) => void;
  setAppMode: (mode: AppMode) => void;
  setOnboardingStage: (stage: number) => void;
  setBrand: (brand: Brand) => void;
  setProfiles: (profiles: SocialProfile[]) => void;
  setProcessingAI: (isProcessing: boolean) => void;
  setInsights: (insights: AnalysisInsights) => void;
  setAdminApiKey: (key: string) => void;
  loginAdmin: (username: string, password: string) => Promise<void>;
  logoutAdmin: () => void;
  setPosts: (posts: Post[]) => void;
  generateStrategy: () => Promise<void>;
  generateCalendarPosts: () => Promise<Post[]>;
  approvePost: (id: string) => void;
  connectMetaOAuth: () => Promise<void>;
}

const initialState: ExtendedAppState = {
  currentView: 'dashboard',
  adminView: 'admin_dashboard',
  appMode: 'app',
  tenantId: 'tenant_demo',
  onboardingStage: 0,
  brand: null,
  socialProfiles: [],
  pillars: [],
  posts: [],
  insights: null,
  isProcessingAI: false,
  plan: 'pro',
  adminApiKey: '',
  adminUsername: '',
  adminLoggedIn: false,
};

const STORAGE_KEY = 'appState';

const getInitialState = (): ExtendedAppState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.posts) {
        parsed.posts = parsed.posts.map((p: any) => ({
          ...p,
          date: new Date(p.date)
        }));
      }
      if (parsed.brand?.colors) {
        parsed.brand.colors = migrateBrandColors(parsed.brand.colors);
      }
      return { ...initialState, ...parsed, isProcessingAI: false };
    }
  } catch (e) {
    console.error("Failed to parse app state", e);
  }
  return initialState;
};

/** Replaces embedded data: URLs (uploaded images) with empty strings so large payloads fit in localStorage. */
function stripDataUrls<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripDataUrls(item)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = typeof val === 'string' && val.startsWith('data:') ? '' : stripDataUrls(val);
    }
    return out as T;
  }
  return value;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<ExtendedAppState>(getInitialState);

  React.useEffect(() => {
    const toSave = { ...state, isProcessingAI: false };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error('Failed to persist app state, retrying without embedded images', e);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stripDataUrls(toSave)));
      } catch (e2) {
        console.error('Failed to persist app state even after stripping images', e2);
      }
    }
  }, [state]);

  const setViewState = (view: ViewState) => setState((s) => ({ ...s, currentView: view }));
  const setAdminView = (view: AdminViewState) => setState((s) => ({ ...s, adminView: view }));
  const setAppMode = (mode: AppMode) => setState((s) => ({ ...s, appMode: mode }));
  const setOnboardingStage = (stage: number) => setState((s) => ({ ...s, onboardingStage: stage }));
  const setBrand = (brand: Brand) => setState((s) => ({ ...s, brand }));
  const setProfiles = (profiles: SocialProfile[]) => setState((s) => ({ ...s, socialProfiles: profiles }));
  const setProcessingAI = (isProcessing: boolean) => setState((s) => ({ ...s, isProcessingAI: isProcessing }));
  const setInsights = (insights: AnalysisInsights) => setState((s) => ({ ...s, insights }));
  const setAdminApiKey = (adminApiKey: string) => setState((s) => ({ ...s, adminApiKey }));
  const setPosts = (posts: Post[]) => setState((s) => ({ ...s, posts }));

  const loginAdmin = async (username: string, password: string) => {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha no login');
    setState((s) => ({
      ...s,
      adminApiKey: data.token,
      adminUsername: data.username,
      adminLoggedIn: true,
      appMode: 'admin',
    }));
  };

  const logoutAdmin = () => {
    setState((s) => ({
      ...s,
      adminApiKey: '',
      adminUsername: '',
      adminLoggedIn: false,
      appMode: 'app',
    }));
  };

  const generateStrategy = async () => {
    setProcessingAI(true);
    try {
      const res = await fetch('/api/generate-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: state.brand, profiles: state.socialProfiles, tenantId: state.tenantId })
      });
      const data = await res.json();
      if (!data.error) {
        setState((s) => ({
          ...s,
          isProcessingAI: false,
          pillars: data.pillars || [],
          strategyPlan: {
            voiceAndTone: data.voiceAndTone || [],
            elevatorPitch: data.elevatorPitch || '',
            keywords: data.keywords || []
          },
          currentView: 'strategy'
        }));
      } else {
        setProcessingAI(false);
      }
    } catch (e) {
      console.error(e);
      setProcessingAI(false);
    }
  };

  const generateCalendarPosts = async (): Promise<Post[]> => {
    if (!state.brand) {
      throw new Error('Complete o onboarding da marca antes de gerar o calendário.');
    }
    const res = await fetch('/api/generate-calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand: state.brand, pillars: state.pillars, tenantId: state.tenantId })
    });
    const data = await res.json();
    const posts = Array.isArray(data.posts) ? data.posts : Array.isArray(data) ? data : [];

    if (!res.ok && !posts.length) {
      throw new Error(data.error || 'Falha ao gerar calendário');
    }
    if (!posts.length) {
      throw new Error('A IA não retornou posts. Tente novamente.');
    }
    return posts as Post[];
  };

  const approvePost = (id: string) => {
    setState((s) => ({
      ...s,
      posts: s.posts.map(p => p.id === id ? { ...p, status: 'approved' } : p)
    }));
  };

  const applyOAuthProfiles = React.useCallback((profiles: SocialProfile[]) => {
    const returnView = sessionStorage.getItem('oauth_return_view') as ViewState | null;
    sessionStorage.removeItem('oauth_return_view');

    setState((s) => ({
      ...s,
      socialProfiles: profiles,
      onboardingStage: returnView === 'onboarding' ? 1 : s.onboardingStage,
      currentView: returnView === 'settings' ? 'settings' : returnView === 'onboarding' ? 'onboarding' : s.currentView,
    }));
  }, []);

  const oauthSessionRef = React.useRef<{ state: string; done: boolean } | null>(null);

  const tryCompleteOAuth = React.useCallback((profiles: SocialProfile[]) => {
    if (oauthSessionRef.current?.done) return;
    if (oauthSessionRef.current) oauthSessionRef.current.done = true;
    applyOAuthProfiles(profiles);
  }, [applyOAuthProfiles]);

  React.useEffect(() => {
    const finishOAuth = (profiles: SocialProfile[]) => {
      tryCompleteOAuth(profiles);
    };

    try {
      const pending = localStorage.getItem('oauth_pending_profiles');
      if (pending) {
        localStorage.removeItem('oauth_pending_profiles');
        finishOAuth(JSON.parse(pending));
      }
    } catch (e) {
      console.error('Failed to restore OAuth profiles from storage', e);
    }

    if (window.location.search.includes('oauth=success')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && Array.isArray(event.data.profiles)) {
        finishOAuth(event.data.profiles);
      }
    };

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('meta_oauth');
      bc.onmessage = (event) => {
        if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && Array.isArray(event.data.profiles)) {
          finishOAuth(event.data.profiles);
        }
      };
    } catch (e) {
      // BroadcastChannel indisponível
    }

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      bc?.close();
    };
  }, [tryCompleteOAuth]);

  const connectMetaOAuth = async () => {
    sessionStorage.setItem('oauth_return_view', state.currentView);
    const oauthState = crypto.randomUUID();
    oauthSessionRef.current = { state: oauthState, done: false };

    try {
      const response = await fetch(`/api/auth/facebook/url?state=${encodeURIComponent(oauthState)}`);
      if (!response.ok) throw new Error('Falha ao obter URL de autenticação');
      const { url } = await response.json();

      const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');
      if (!authWindow) {
        alert('Permita popups para conectar sua conta Meta.');
        window.location.href = url;
        return;
      }

      let resolved = false;
      const applyOnce = (profiles: SocialProfile[]) => {
        if (resolved) return;
        resolved = true;
        tryCompleteOAuth(profiles);
        try { authWindow.close(); } catch (e) { /* ignore */ }
      };

      const poll = setInterval(async () => {
        if (resolved) {
          clearInterval(poll);
          return;
        }

        try {
          const resultRes = await fetch(`/api/auth/facebook/result?state=${encodeURIComponent(oauthState)}`);
          if (resultRes.ok) {
            const data = await resultRes.json();
            if (data.ready && Array.isArray(data.profiles)) {
              clearInterval(poll);
              applyOnce(data.profiles);
              return;
            }
          }
        } catch (e) {
          console.error('OAuth server poll failed', e);
        }

        if (authWindow.closed) {
          clearInterval(poll);
        }
      }, 500);

      setTimeout(() => clearInterval(poll), 120000);
    } catch (error) {
      console.error('OAuth error:', error);
      alert('Não foi possível iniciar autenticação Meta. Configure App ID e Secret no painel admin.');
    }
  };

  return (
    <AppContext.Provider value={{
      state,
      setViewState,
      setAdminView,
      setAppMode,
      setOnboardingStage,
      setBrand,
      setProfiles,
      setProcessingAI,
      setInsights,
      setAdminApiKey,
      loginAdmin,
      logoutAdmin,
      setPosts,
      generateStrategy,
      generateCalendarPosts,
      approvePost,
      connectMetaOAuth,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppStore must be used within AppProvider');
  return context;
};
