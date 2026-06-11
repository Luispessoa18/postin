export const DEFAULT_COLORS = ['#4f46e5', '#f97316', '#0f172a'];

export function normalizeHex(color: string): string {
  let hex = color.trim().toLowerCase();
  if (!hex.startsWith('#')) hex = `#${hex}`;
  if (hex.length === 4) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return hex;
}

export function dedupeColors(colors: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const c of colors) {
    if (!c) continue;
    const norm = normalizeHex(c);
    if (!seen.has(norm)) {
      seen.add(norm);
      result.push(norm);
    }
  }
  return result;
}

export function migrateBrandColors(colors: unknown): string[] {
  if (Array.isArray(colors)) {
    return dedupeColors(colors.length ? colors : DEFAULT_COLORS);
  }
  if (colors && typeof colors === 'object') {
    const obj = colors as Record<string, string>;
    return dedupeColors([obj.primary, obj.secondary, obj.accent].filter(Boolean));
  }
  return [...DEFAULT_COLORS];
}
