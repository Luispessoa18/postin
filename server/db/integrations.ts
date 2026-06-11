import { getDb, maskKey } from './index.js';

export interface PlatformIntegrations {
  id: number;
  facebook_app_id: string | null;
  facebook_app_secret: string | null;
  app_url: string | null;
  cloudflare_tunnel_active: number;
  updated_at: string;
}

export interface ResolvedIntegrations {
  facebookAppId: string | null;
  facebookAppSecret: string | null;
  appUrl: string | null;
}

export function getPlatformIntegrationsRow(): PlatformIntegrations {
  const db = getDb();
  let row = db.prepare('SELECT * FROM platform_integrations WHERE id = 1').get() as PlatformIntegrations | undefined;
  if (!row) {
    db.prepare(`
      INSERT INTO platform_integrations (id, facebook_app_id, facebook_app_secret, app_url)
      VALUES (1, ?, ?, ?)
    `).run(
      process.env.FACEBOOK_APP_ID || null,
      process.env.FACEBOOK_APP_SECRET || null,
      process.env.APP_URL || null
    );
    row = db.prepare('SELECT * FROM platform_integrations WHERE id = 1').get() as PlatformIntegrations;
  }
  return row;
}

export function getResolvedIntegrations(): ResolvedIntegrations {
  const row = getPlatformIntegrationsRow();
  return {
    facebookAppId: row.facebook_app_id || process.env.FACEBOOK_APP_ID || null,
    facebookAppSecret: row.facebook_app_secret || process.env.FACEBOOK_APP_SECRET || null,
    appUrl: row.app_url || process.env.APP_URL || null,
  };
}

export function updatePlatformIntegrations(updates: Partial<{
  facebook_app_id: string | null;
  facebook_app_secret: string | null;
  app_url: string | null;
  cloudflare_tunnel_active: number;
}>): PlatformIntegrations {
  const db = getDb();
  const current = getPlatformIntegrationsRow();

  db.prepare(`
    UPDATE platform_integrations SET
      facebook_app_id = ?,
      facebook_app_secret = ?,
      app_url = ?,
      cloudflare_tunnel_active = ?,
      updated_at = datetime('now')
    WHERE id = 1
  `).run(
    updates.facebook_app_id !== undefined ? updates.facebook_app_id : current.facebook_app_id,
    updates.facebook_app_secret !== undefined ? updates.facebook_app_secret : current.facebook_app_secret,
    updates.app_url !== undefined ? updates.app_url : current.app_url,
    updates.cloudflare_tunnel_active !== undefined ? updates.cloudflare_tunnel_active : current.cloudflare_tunnel_active,
  );

  return getPlatformIntegrationsRow();
}

export function getIntegrationsForAdmin() {
  const row = getPlatformIntegrationsRow();
  return {
    facebookAppId: row.facebook_app_id || '',
    facebookAppSecret: row.facebook_app_secret ? maskKey(row.facebook_app_secret) : '',
    hasFacebookAppSecret: !!row.facebook_app_secret,
    appUrl: row.app_url || '',
    cloudflareTunnelActive: row.cloudflare_tunnel_active === 1,
    oauthRedirectUri: row.app_url ? `${row.app_url.replace(/\/$/, '')}/api/auth/facebook/callback` : '',
  };
}
