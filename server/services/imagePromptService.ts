import * as aiRouter from '../ai/router.js';
import { DEMO_TENANT_ID } from '../db/index.js';
import { migrateBrandColors } from '../lib/brandColors.js';
import { INSTAGRAM_PREMIUM_TEMPLATE, fillTemplate } from '../prompts/instagramPremiumTemplate.js';

interface LibraryItemInput {
  id: string;
  imageUrl: string;
  kind?: 'post' | 'product';
  caption?: string;
  label?: string;
  isReference?: boolean;
}

const MAX_REFERENCE_IMAGES = 3;

interface BuildImagePromptInput {
  brand: {
    name: string;
    segment: string;
    subSegment?: string;
    about?: string;
    colors: unknown;
  };
  post: {
    theme: string;
    format?: string;
    pilar?: string;
    copy?: { headline?: string; body?: string };
  };
  contentLibrary?: LibraryItemInput[];
  productPhotos?: string[];
  tenantId?: string;
}

const SCENARIO_BY_SEGMENT: Record<string, string> = {
  imobili: 'casa sofisticada com arquitetura moderna e acabamento premium',
  'imóvel': 'casa sofisticada com arquitetura moderna e acabamento premium',
  'real estate': 'casa sofisticada com arquitetura moderna e acabamento premium',
  'saúde': 'ambiente médico clean e acolhedor',
  health: 'ambiente médico clean e acolhedor',
  fitness: 'academia moderna com iluminação natural',
  tech: 'setup tecnológico minimalista e corporativo',
  tecnologia: 'setup tecnológico minimalista e corporativo',
  fintech: 'escritório financeiro moderno com elementos de dados discretos',
  educação: 'ambiente educacional elegante e digital',
  education: 'ambiente educacional elegante e digital',
  travel: 'destino premium com sensação de exclusividade',
  viagem: 'destino premium com sensação de exclusividade',
};

function inferScenario(segment: string, subSegment?: string): string {
  const combined = `${segment} ${subSegment || ''}`.toLowerCase();
  for (const [key, scenario] of Object.entries(SCENARIO_BY_SEGMENT)) {
    if (combined.includes(key)) return scenario;
  }
  return 'ambiente corporativo moderno e lifestyle premium';
}

function inferVisualStyle(segment: string): string {
  const s = segment.toLowerCase();
  if (s.includes('imobili') || s.includes('imóvel') || s.includes('real estate')) {
    return 'premium imobiliário, editorial, clean, sofisticado';
  }
  if (s.includes('tech') || s.includes('tecnologia') || s.includes('fintech')) {
    return 'tech premium, UI inspired, glass morphism discreto';
  }
  return 'high-end marketing design, contemporâneo, minimalista';
}

function extractKeyword(headline: string): string {
  const words = headline.replace(/[^\w\sáàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/g, '').split(/\s+/).filter(w => w.length > 3);
  return words[0] || headline.split(' ')[0] || 'Destaque';
}

function getProductItems(library: LibraryItemInput[] | undefined, productPhotos: string[] | undefined): LibraryItemInput[] {
  const fromLibrary = (library || []).filter(i => i.kind === 'product');
  if (fromLibrary.length) return fromLibrary;
  return (productPhotos || []).map((url, i) => ({
    id: `product-${i}`,
    imageUrl: url,
    kind: 'product' as const,
    label: `Produto ${i + 1}`,
  }));
}

function selectRelevantProducts(
  products: LibraryItemInput[],
  theme: string,
  segment: string
): LibraryItemInput[] {
  if (!products.length) return [];
  const text = `${theme} ${segment}`.toLowerCase();
  const keywords = ['casa', 'imóvel', 'imovel', 'apartamento', 'produto', 'serviço', 'servico', 'propriedade'];
  const hasRelevantContext = keywords.some(k => text.includes(k)) ||
    segment.toLowerCase().includes('imobili') ||
    segment.toLowerCase().includes('real estate');

  if (hasRelevantContext || products.length <= 3) {
    return products.slice(0, 3);
  }
  return products.slice(0, 2);
}

function buildProductReferenceBlock(products: LibraryItemInput[]): string {
  if (!products.length) return '';
  const lines = products.map((p, i) => {
    const desc = p.label || p.caption || `Referência ${i + 1}`;
    return `- ${desc}`;
  });
  return `
REGRA CRÍTICA — REFERÊNCIAS REAIS:
Utilize EXCLUSIVAMENTE as propriedades/produtos reais descritos abaixo.
NÃO invente imóveis, produtos ou ambientes que não correspondam às referências.
As imagens devem representar fielmente os ativos reais da marca.
Referências:
${lines.join('\n')}`;
}

/**
 * Picks the library items (real product photos + posts the user marked as
 * style references) to send as image inputs alongside the prompt.
 */
export function selectReferenceItems(input: BuildImagePromptInput): LibraryItemInput[] {
  const products = selectRelevantProducts(
    getProductItems(input.contentLibrary, input.productPhotos),
    input.post.theme,
    input.brand.segment
  );
  const referencePosts = (input.contentLibrary || []).filter(i => i.kind !== 'product' && i.isReference);
  return [...products, ...referencePosts].slice(0, MAX_REFERENCE_IMAGES);
}

const STORY_FORMAT_NOTE = `
FORMATO STORIES (REGRA CRÍTICA):
Ignore o formato 1:1 acima. Adapte TODA a composição para vertical 9:16 (1080x1920, formato Stories).
Centralize os elementos principais verticalmente, deixando margens de segurança no topo e na base
(onde o app sobrepõe a interface de Stories). Mantenha a mesma identidade visual, paleta e área
reservada para a logo no canto inferior esquerdo.`;

function buildReferenceImagesNote(referenceCount: number): string {
  if (!referenceCount) return '';
  return `
NOTA — IMAGENS DE REFERÊNCIA ANEXADAS:
Você recebeu ${referenceCount} imagem(ns) de referência real da marca (produtos e/ou posts anteriores).
Use-as como base visual para fidelidade de produto, paleta e estilo. Não as copie literalmente, mas mantenha consistência.`;
}

function buildBasePrompt(input: BuildImagePromptInput): string {
  const colors = migrateBrandColors(input.brand.colors);
  const headline = input.post.copy?.headline || input.post.theme;
  const subtitle = input.post.pilar || input.brand.segment;
  const products = selectRelevantProducts(
    getProductItems(input.contentLibrary, input.productPhotos),
    input.post.theme,
    input.brand.segment
  );

  const vars = {
    NICHO: `${input.brand.segment}${input.brand.subSegment ? ` — ${input.brand.subSegment}` : ''}`,
    OBJETIVO_DA_MENSAGEM: headline,
    ESTILO_VISUAL: inferVisualStyle(input.brand.segment),
    TIPO_DE_RENDER: 'fotografia comercial premium com elementos gráficos UI discretos',
    EMOCAO: 'confiança, valor elevado, desejo de conversão',
    TIPO_ILUMINACAO: 'iluminação difusa suave com contraste cinematográfico leve',
    CORES_PRINCIPAIS: colors.join(', '),
    CENARIO_REALISTA: inferScenario(input.brand.segment, input.brand.subSegment),
    DESCRICAO_PERSONAGEM: 'Sem personagem, foco no produto/cenário e tipografia',
    SUBTITULO: subtitle,
    TITULO: headline,
    PALAVRA_CHAVE_DESTACADA: extractKeyword(headline),
    COR_DESTAQUE: colors[2] || colors[0] || '#f97316',
  };

  const filled = fillTemplate(INSTAGRAM_PREMIUM_TEMPLATE, vars);
  const productBlock = buildProductReferenceBlock(products);
  const referenceNote = buildReferenceImagesNote(selectReferenceItems(input).length);
  const storyNote = input.post.format === 'story' ? STORY_FORMAT_NOTE : '';
  return filled + productBlock + referenceNote + storyNote;
}

export async function buildImagePrompt(input: BuildImagePromptInput): Promise<string> {
  const basePrompt = buildBasePrompt(input);
  const products = selectRelevantProducts(
    getProductItems(input.contentLibrary, input.productPhotos),
    input.post.theme,
    input.brand.segment
  );

  const adaptPrompt = `Você recebe um template base de prompt para arte Instagram premium.
Adapte-o ao contexto específico da marca e do post abaixo.
Mantenha TODAS as regras do template (anti-surreal, área reservada para logo no canto inferior esquerdo, restrições).
Retorne APENAS o prompt final pronto para geração de imagem, em português, sem explicações.

Marca: ${input.brand.name}
Segmento: ${input.brand.segment}
Sobre: ${input.brand.about || 'N/A'}
Post tema: ${input.post.theme}
Formato: ${input.post.format || 'post'}
Copy: ${input.post.copy?.headline || ''} — ${input.post.copy?.body || ''}
Fotos de produto relevantes: ${products.map(p => p.label || p.caption || 'produto').join('; ') || 'nenhuma'}

Template base:
${basePrompt}`;

  try {
    const adapted = await aiRouter.generateText(
      input.tenantId || DEMO_TENANT_ID,
      'generate-image-prompt',
      adaptPrompt
    );
    return adapted.trim() || basePrompt;
  } catch {
    return basePrompt;
  }
}
