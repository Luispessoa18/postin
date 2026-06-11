import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import * as dotenv from 'dotenv';
import { getDb, DEMO_TENANT_ID } from './server/db/index.js';
import * as aiRouter from './server/ai/router.js';
import settingsRoutes from './server/routes/settings.js';
import adminRoutes from './server/routes/admin.js';
import socialRoutes from './server/routes/social.js';
import { getResolvedIntegrations } from './server/db/integrations.js';
import { parseFacebookPage, META_ACCOUNTS_FIELDS, buildMockProfiles } from './server/services/metaApi.js';
import { renderOAuthCallbackHtml } from './server/services/oauthCallbackHtml.js';
import { saveOAuthResult, peekOAuthResult } from './server/services/oauthResultStore.js';
import { normalizeCalendarResponse, CALENDAR_FALLBACK } from './server/services/calendarUtils.js';
import { dedupeColors, DEFAULT_COLORS } from './server/lib/brandColors.js';
import { buildImagePrompt, selectReferenceItems } from './server/services/imagePromptService.js';
import { resolveImageToBase64, UPLOADS_ROOT } from './server/lib/uploads.js';
import { overlayBrandLogo } from './server/lib/imageCompose.js';
import uploadsRoutes from './server/routes/uploads.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3080', 10);
  app.set('port', PORT);

  app.use(express.json({ limit: '15mb' }));

  getDb();

  app.use('/uploads', express.static(UPLOADS_ROOT));
  app.use('/api/uploads', uploadsRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/social', socialRoutes);

  app.post("/api/generate-strategy", async (req, res) => {
    try {
      const { brand, profiles, tenantId } = req.body;
      const prompt = `
Você é um estrategista de marketing digital de alto nível. Crie uma estratégia de conteúdo para a marca abaixo.
Responda SEMPRE em português do Brasil. Não utilize nenhuma palavra, frase ou expressão em inglês (incluindo termos como "Luxury", "Premium Lifestyle", "Dream Home" etc.) — traduza tudo para português, mesmo termos comuns de marketing.

Marca: ${brand.name}
Segmento: ${brand.segment}
Sobre: ${brand.about || 'N/A'}
Perfis conectados: ${JSON.stringify((profiles || []).map((p: any) => p.name))}

Retorne um JSON com esta estrutura EXATA:
{
  "voiceAndTone": ["Profissional", "Adjetivo2", "Adjetivo3"],
  "elevatorPitch": "Pitch persuasivo da marca em 1-2 frases...",
  "keywords": ["palavra1", "palavra2", "palavra3", "palavra4"],
  "pillars": [
    { "name": "Nome do pilar (ex: Educação)", "percentage": 40, "description": "Descrição breve" }
  ]
}
Os percentuais dos pilares devem somar 100. Forneça 3-4 pilares adaptados ao segmento e ao texto sobre a marca.
`;

      const text = await aiRouter.generateText(tenantId || DEMO_TENANT_ID, 'generate-strategy', prompt, { jsonMode: true });
      const data = JSON.parse(text || "{}");
      res.json(data);
    } catch (err) {
      console.error("Strategy AI Error", err);
      res.json({
        voiceAndTone: ["Profissional", "Inspirador", "Técnico"],
        elevatorPitch: "Oferecemos soluções de alto desempenho para nosso público, com foco em resultados sustentáveis.",
        keywords: ["Saúde", "Performance", "Crescimento", "Engajamento"],
        pillars: [
          { name: "Educação", percentage: 40, description: "Ensinar e agregar valor ao público." },
          { name: "Autoridade", percentage: 20, description: "Demonstrar expertise e resultados." },
          { name: "Prova social", percentage: 20, description: "Depoimentos e cases de sucesso." },
          { name: "Oferta", percentage: 20, description: "Conteúdo de vendas e promoções." }
        ]
      });
    }
  });

  app.post("/api/generate-calendar", async (req, res) => {
    try {
      const { brand, pillars, tenantId } = req.body;

      if (!brand?.name) {
        return res.status(400).json({ error: 'Complete o onboarding da marca antes de gerar o calendário.' });
      }

      const prompt = `
Você é um planejador de conteúdo para redes sociais da marca ${brand.name} (Segmento: ${brand.segment}).
Sobre: ${brand.about || 'N/A'}

Pilares de conteúdo:
${JSON.stringify(pillars || [])}

Gere exatamente 5 posts altamente engajadores adaptados a esta marca.
Responda SEMPRE em português do Brasil. Não utilize nenhuma palavra, frase ou expressão em inglês em nenhum campo (theme, headline, body) — incluindo termos como "Luxury Living", "Dream Home", "Premium Lifestyle" etc. Traduza tudo para português, mesmo termos comuns de marketing imobiliário/digital.

Retorne um JSON com um array "posts" neste formato EXATO:
{
  "posts": [
    {
      "theme": "Título curto e chamativo",
      "pilar": "Nome de um dos pilares acima",
      "format": "carousel" | "reels" | "post" | "story",
      "copy": {
        "headline": "Gancho que para o scroll!",
        "body": "Texto com valor real, sem placeholders.",
        "hashtags": ["#tag1", "#tag2"]
      }
    }
  ]
}
Use sempre o campo "pilar" (não "pillar"). Gere exatamente 5 posts.
`;

      const text = await aiRouter.generateText(tenantId || DEMO_TENANT_ID, 'generate-calendar', prompt, { jsonMode: true });
      let parsed: unknown;
      try {
        parsed = JSON.parse(text || '{"posts":[]}');
      } catch {
        parsed = { posts: [] };
      }
      let posts = normalizeCalendarResponse(parsed);

      if (!posts.length) {
        console.warn('Calendar AI returned empty/invalid posts, using fallback. Raw:', text?.slice(0, 500));
        posts = CALENDAR_FALLBACK;
      }

      res.json({ posts });
    } catch (err: any) {
      console.error("Calendar AI Error", err);
      res.json({ posts: CALENDAR_FALLBACK, warning: err.message || 'Usando calendário padrão' });
    }
  });

  app.post("/api/generate-insights", async (req, res) => {
    try {
      const { brand, profiles, contentLibrary, tenantId } = req.body;
      const postsSummary = (contentLibrary || []).slice(0, 15).map((p: any) => ({
        caption: p.caption?.slice(0, 200),
        likes: p.likes,
        comments: p.comments,
        type: p.mediaType,
      }));

      const prompt = `Você é um analista de marketing digital. Analise a marca e os perfis sociais conectados.
Responda SEMPRE em português do Brasil. Não utilize nenhuma palavra ou expressão em inglês — traduza tudo para português, mesmo termos comuns de marketing.

Marca: ${brand.name}
Segmento: ${brand.segment}
Sobre: ${brand.about}
Perfis: ${JSON.stringify(profiles.map((p: any) => ({
  name: p.name,
  followers: p.facebook?.followers || p.instagram?.followers,
  bio: p.instagram?.biography,
})))}
Posts recentes do Instagram: ${JSON.stringify(postsSummary)}

Retorne um JSON com esta estrutura EXATA:
{
  "whatWorks": ["ponto positivo 1", "ponto positivo 2"],
  "whatDoesntWork": ["ponto negativo 1", "ponto negativo 2"],
  "idealFrequency": "ex: 4 vezes por semana",
  "idealTimes": ["08:00", "18:00"],
  "topThemes": ["tema 1", "tema 2", "tema 3"],
  "suggestions": ["sugestão 1", "sugestão 2"]
}`;

      const text = await aiRouter.generateText(tenantId || DEMO_TENANT_ID, 'generate-insights', prompt, { jsonMode: true });
      const data = JSON.parse(text || "{}");
      res.json(data);
    } catch (err) {
      console.error("Insights AI Error", err);
      res.json({
        whatWorks: ['Vídeos curtos e dinâmicos', 'Fotografia autêntica da marca'],
        whatDoesntWork: ['Posts com muito texto e pouca imagem', 'Publicação irregular'],
        idealFrequency: '4 vezes por semana',
        idealTimes: ['09:00', '18:00'],
        topThemes: ['Bastidores', 'Dicas do segmento', 'Depoimentos'],
        suggestions: ['Responda comentários nas primeiras 2 horas', 'Use Stories para enquetes semanais']
      });
    }
  });

  app.post("/api/extract-colors", async (req, res) => {
    try {
      const { segment, name, tenantId } = req.body;
      const prompt = `You are a design AI. Suggest up to 6 distinct hex colors for a brand palette.
Brand: ${name}
Segment: ${segment}
Return ONLY JSON format: {"colors": ["#hex1", "#hex2", "#hex3", ...]}
All colors must be different from each other.`;

      const text = await aiRouter.generateText(tenantId || DEMO_TENANT_ID, 'extract-colors', prompt, { jsonMode: true });
      const data = JSON.parse(text || "{}");
      const colors = dedupeColors(
        Array.isArray(data.colors)
          ? data.colors
          : [data.primary, data.secondary, data.accent].filter(Boolean)
      );
      res.json({ colors: colors.length ? colors : DEFAULT_COLORS });
    } catch (err) {
      console.error("Color AI Error", err);
      res.json({ colors: DEFAULT_COLORS });
    }
  });

  app.post("/api/generate-image", async (req, res) => {
    try {
      const { post, brand, tenantId, prompt: userPrompt, contentLibrary, productPhotos, sourceImageUrl } = req.body;
      let finalPrompt = userPrompt;

      const promptInput = post && brand ? {
        brand,
        post,
        contentLibrary,
        productPhotos: productPhotos || brand.productPhotos,
        tenantId,
      } : null;

      if (!finalPrompt && promptInput) {
        finalPrompt = await buildImagePrompt(promptInput);
      } else if (!finalPrompt) {
        throw new Error("Missing prompt or post/brand data");
      }

      let references: { data: string; mimeType: string }[] = [];
      if (sourceImageUrl) {
        const sourceImage = await resolveImageToBase64(sourceImageUrl);
        if (sourceImage) references.push(sourceImage);
      }
      if (promptInput) {
        const referenceItems = selectReferenceItems(promptInput);
        const resolved = await Promise.all(referenceItems.map(item => resolveImageToBase64(item.imageUrl)));
        references.push(...resolved.filter((r): r is { data: string; mimeType: string } => !!r));
      }

      const aspectRatio = post?.format === 'story' ? '9:16' : '1:1';
      const result = await aiRouter.generateImage(tenantId || DEMO_TENANT_ID, 'generate-image', finalPrompt, references.length ? references : undefined, aspectRatio);

      let imageUrl = result.imageUrl;
      if (brand && imageUrl.startsWith('data:image/')) {
        imageUrl = await overlayBrandLogo(imageUrl, brand);
      }

      res.json({ ...result, imageUrl, refinedPrompt: finalPrompt });
    } catch (err: any) {
      console.error("Image Gen Error", err);
      res.status(500).json({ error: err.message || "Failed to generate image" });
    }
  });

  app.get("/api/auth/facebook/url", (req, res) => {
    const integrations = getResolvedIntegrations();
    const clientId = integrations.facebookAppId;
    const state = typeof req.query.state === 'string' && req.query.state.length >= 8
      ? req.query.state
      : crypto.randomUUID();

    const baseUrl = integrations.appUrl
      ? integrations.appUrl.replace(/\/$/, '')
      : `http://${req.headers.host}`;

    if (!clientId) {
      const mockUrl = `${baseUrl}/api/auth/facebook/mock-callback?state=${encodeURIComponent(state)}`;
      return res.json({ url: mockUrl, redirectUri: mockUrl, state });
    }

    const redirectUri = `${baseUrl}/api/auth/facebook/callback`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'email,pages_show_list,instagram_basic,instagram_manage_insights',
      state,
    });

    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
    res.json({ url: authUrl, redirectUri, state });
  });

  app.get("/api/auth/facebook/result", (req, res) => {
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    if (!state) {
      return res.status(400).json({ ready: false, error: 'state obrigatório' });
    }
    const profiles = peekOAuthResult(state);
    if (!profiles) {
      return res.json({ ready: false });
    }
    res.json({ ready: true, profiles });
  });

  app.get("/api/auth/facebook/mock-callback", (req, res) => {
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    const profiles = buildMockProfiles();
    if (state) saveOAuthResult(state, profiles);
    res.type('html').send(renderOAuthCallbackHtml(profiles, state));
  });

  app.get("/api/auth/facebook/callback", async (req, res) => {
    const { code, state } = req.query;
    const oauthState = typeof state === 'string' ? state : '';
    const integrations = getResolvedIntegrations();
    const clientId = integrations.facebookAppId;
    const clientSecret = integrations.facebookAppSecret;

    if (!code) {
      return res.status(400).send("Código não fornecido pelo Facebook");
    }

    const baseUrl = integrations.appUrl
      ? integrations.appUrl.replace(/\/$/, '')
      : `http://${req.headers.host}`;
    const redirectUri = `${baseUrl}/api/auth/facebook/callback`;

    try {
      let profiles: any[] = [];
      if (clientId && clientSecret) {
        const tokenParams = new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          client_secret: clientSecret,
          code: code as string
        });

        const response = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${tokenParams.toString()}`);
        const data = await response.json();

        if (data.error) {
          console.error("Facebook OAuth Error:", data.error);
        } else if (data.access_token) {
          try {
            const accountsResponse = await fetch(
              `https://graph.facebook.com/v19.0/me/accounts?fields=${META_ACCOUNTS_FIELDS}&access_token=${data.access_token}`
            );
            const accountsData = await accountsResponse.json();
            if (accountsData.data) {
              profiles = accountsData.data.map((page: any) => parseFacebookPage(page));
            }
          } catch(err) {
            console.error("Facebook Accounts fetch error:", err);
          }
        }
      }

      if (oauthState) saveOAuthResult(oauthState, profiles);
      res.type('html').send(renderOAuthCallbackHtml(profiles, oauthState));
    } catch (err) {
      console.error(err);
      res.status(500).send("Falha na autenticação");
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
