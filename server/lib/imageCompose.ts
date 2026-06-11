import sharp from 'sharp';
import { resolveImageToBase64 } from './uploads.js';

interface BrandLogos {
  logoUrl?: string;
  logoUrlTransparent?: string;
  logoUrlLight?: string;
  logoUrlDark?: string;
}

/**
 * Composites the brand logo into the bottom-left corner of a generated image,
 * matching the safe area reserved by the Instagram premium prompt template.
 * Prefers the transparent/light variants since that area is a dark gradient.
 */
export async function overlayBrandLogo(imageDataUrl: string, brand: BrandLogos): Promise<string> {
  const logoUrl = brand.logoUrlTransparent || brand.logoUrlLight || brand.logoUrl || brand.logoUrlDark;
  if (!logoUrl) return imageDataUrl;

  const baseMatch = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(imageDataUrl);
  if (!baseMatch) return imageDataUrl;

  const logo = await resolveImageToBase64(logoUrl);
  if (!logo) return imageDataUrl;

  try {
    const baseBuffer = Buffer.from(baseMatch[2], 'base64');
    const logoBuffer = Buffer.from(logo.data, 'base64');

    const baseImage = sharp(baseBuffer);
    const { width = 1024, height = 1024 } = await baseImage.metadata();

    const margin = Math.round(width * 0.05);
    const targetWidth = Math.round(width * 0.22);
    const targetHeight = Math.round(height * 0.18);

    const resizedLogo = await sharp(logoBuffer)
      .resize({ width: targetWidth, height: targetHeight, fit: 'inside', withoutEnlargement: true })
      .toBuffer();
    const logoMeta = await sharp(resizedLogo).metadata();

    const composited = await baseImage
      .composite([{
        input: resizedLogo,
        left: margin,
        top: height - margin - (logoMeta.height || targetHeight),
      }])
      .png()
      .toBuffer();

    return `data:image/png;base64,${composited.toString('base64')}`;
  } catch (err) {
    console.error('Failed to overlay brand logo:', err);
    return imageDataUrl;
  }
}
