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

export function addColor(list: string[], hex: string): string[] {
  const norm = normalizeHex(hex);
  if (list.some(c => normalizeHex(c) === norm)) return list;
  return [...list, norm];
}

export function removeColor(list: string[], index: number): string[] {
  if (list.length <= 1) return list;
  return list.filter((_, i) => i !== index);
}

export function getPrimary(colors: string[]): string {
  return colors[0] || DEFAULT_COLORS[0];
}

export function getSecondary(colors: string[]): string {
  return colors[1] || DEFAULT_COLORS[1];
}

export function getAccent(colors: string[]): string {
  return colors[2] || DEFAULT_COLORS[2];
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

export function mergeExtractedColors(existing: string[], extracted: string[]): string[] {
  return dedupeColors([...existing, ...extracted]);
}
