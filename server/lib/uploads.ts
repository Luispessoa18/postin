import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const UPLOADS_ROOT = path.join(process.cwd(), 'data', 'uploads');

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

function sanitizeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_') || 'default';
}

function resolveWithinUploads(relativePath: string): string | null {
  const filePath = path.join(UPLOADS_ROOT, relativePath);
  const resolved = path.resolve(filePath);
  if (resolved !== path.resolve(UPLOADS_ROOT) && !resolved.startsWith(path.resolve(UPLOADS_ROOT) + path.sep)) {
    return null;
  }
  return resolved;
}

export interface SavedUpload {
  url: string;
}

/** Decodes a base64 data URL and stores it under data/uploads/<tenantId>/<category>/. */
export function saveUploadFromDataUrl(tenantId: string, category: string, dataUrl: string): SavedUpload {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    throw new Error('Formato de imagem inválido');
  }
  const mimeType = match[1].toLowerCase();
  const base64 = match[2];
  const ext = EXT_BY_MIME[mimeType] || 'png';

  const tenant = sanitizeSegment(tenantId);
  const cat = sanitizeSegment(category);
  const dir = path.join(UPLOADS_ROOT, tenant, cat);
  fs.mkdirSync(dir, { recursive: true });

  const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
  fs.writeFileSync(path.join(dir, filename), Buffer.from(base64, 'base64'));

  return { url: `/uploads/${tenant}/${cat}/${filename}` };
}

/** Removes a previously stored upload, given its `/uploads/...` URL. */
export function deleteUploadByUrl(url: string): boolean {
  if (!url.startsWith('/uploads/')) return false;
  const resolved = resolveWithinUploads(url.replace(/^\/uploads\//, ''));
  if (!resolved || !fs.existsSync(resolved)) return false;
  fs.unlinkSync(resolved);
  return true;
}

/** Reads a stored upload from disk and returns it as base64, given its `/uploads/...` URL. */
export function readUploadAsBase64(url: string): { data: string; mimeType: string } | null {
  if (!url.startsWith('/uploads/')) return null;
  const resolved = resolveWithinUploads(url.replace(/^\/uploads\//, ''));
  if (!resolved || !fs.existsSync(resolved)) return null;
  const ext = path.extname(resolved).slice(1).toLowerCase();
  const mimeType = MIME_BY_EXT[ext] || 'image/png';
  return { data: fs.readFileSync(resolved).toString('base64'), mimeType };
}

/** Resolves any image reference (data URL, local /uploads/ path, or remote http URL) to base64. */
export async function resolveImageToBase64(imageUrl: string): Promise<{ data: string; mimeType: string } | null> {
  if (!imageUrl) return null;

  if (imageUrl.startsWith('data:')) {
    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(imageUrl);
    return match ? { mimeType: match[1].toLowerCase(), data: match[2] } : null;
  }

  if (imageUrl.startsWith('/uploads/')) {
    return readUploadAsBase64(imageUrl);
  }

  if (/^https?:\/\//.test(imageUrl)) {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) return null;
      const mimeType = response.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
      const buffer = Buffer.from(await response.arrayBuffer());
      return { data: buffer.toString('base64'), mimeType };
    } catch (err) {
      console.error('Failed to fetch remote reference image:', imageUrl, err);
      return null;
    }
  }

  return null;
}
