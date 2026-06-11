export interface CalendarPostDraft {
  theme: string;
  pilar: string;
  format: string;
  copy?: {
    headline: string;
    body: string;
    hashtags: string[];
  };
}

const ARRAY_KEYS = ['posts', 'data', 'items', 'calendar', 'content', 'results'];

function normalizePostItem(item: unknown): CalendarPostDraft | null {
  if (!item || typeof item !== 'object') return null;
  const o = item as Record<string, unknown>;

  const theme = pickString(o, ['theme', 'title', 'titulo', 'topic', 'subject']);
  if (!theme) return null;

  const pilar = pickString(o, ['pilar', 'pillar', 'pillarName', 'content_pillar']) || 'Conteúdo';
  const format = pickString(o, ['format', 'type', 'mediaType']) || 'post';

  let copy = o.copy as CalendarPostDraft['copy'] | undefined;
  if (!copy || typeof copy !== 'object') {
    const headline = pickString(o, ['headline', 'hook', 'title']);
    const body = pickString(o, ['body', 'caption', 'text', 'description']);
    if (headline || body) {
      copy = {
        headline: headline || theme,
        body: body || '',
        hashtags: Array.isArray(o.hashtags) ? o.hashtags.map(String) : ['#marca'],
      };
    }
  }

  return { theme, pilar, format, copy };
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === 'string' && val.trim()) return val.trim();
  }
  return undefined;
}

function extractArrays(obj: Record<string, unknown>, depth = 0): unknown[][] {
  if (depth > 3) return [];
  const found: unknown[][] = [];

  for (const key of ARRAY_KEYS) {
    if (Array.isArray(obj[key])) found.push(obj[key] as unknown[]);
  }

  for (const val of Object.values(obj)) {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      found.push(...extractArrays(val as Record<string, unknown>, depth + 1));
    }
  }

  return found;
}

export function normalizeCalendarResponse(parsed: unknown): CalendarPostDraft[] {
  const candidates: unknown[] = [];

  if (Array.isArray(parsed)) {
    candidates.push(...parsed);
  } else if (parsed && typeof parsed === 'object') {
    const arrays = extractArrays(parsed as Record<string, unknown>);
    if (arrays.length) {
      candidates.push(...arrays[0]);
    }
  }

  return candidates
    .map(normalizePostItem)
    .filter((p): p is CalendarPostDraft => p !== null);
}

export const CALENDAR_FALLBACK: CalendarPostDraft[] = [
  {
    theme: '5 erros que impedem você de alcançar seus objetivos',
    pilar: 'Educação',
    format: 'carousel',
    copy: {
      headline: 'Atenção: 5 erros que impedem você de alcançar seus objetivos',
      body: 'Copy detalhada gerada pela IA com foco em engajamento e valor real para o público.',
      hashtags: ['#crescimento', '#dicas'],
    },
  },
  {
    theme: 'Bastidores',
    pilar: 'Autoridade',
    format: 'reels',
    copy: {
      headline: 'Veja como funciona por dentro!',
      body: 'Trabalhamos para oferecer o melhor ambiente e experiência.',
      hashtags: ['#bastidores'],
    },
  },
  {
    theme: 'Transformação de cliente',
    pilar: 'Prova social',
    format: 'post',
    copy: {
      headline: 'Que transformação!',
      body: 'Trabalho consistente gera resultados. Veja os resultados incríveis.',
      hashtags: ['#transformacao', '#resultados'],
    },
  },
  {
    theme: 'Oferta limitada: 20% off',
    pilar: 'Oferta',
    format: 'story',
    copy: {
      headline: '20% OFF',
      body: 'Aproveite nosso desconto especial. Válido enquanto durarem as vagas.',
      hashtags: ['#oferta', '#desconto'],
    },
  },
  {
    theme: 'Como começar',
    pilar: 'Educação',
    format: 'carousel',
    copy: {
      headline: 'Passo a passo para começar',
      body: 'Guia rápido para dar o primeiro passo com confiança.',
      hashtags: ['#guia', '#comecar'],
    },
  },
];
