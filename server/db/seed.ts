import type Database from 'better-sqlite3';
import { DEMO_TENANT_ID } from './constants.js';

export function seedDatabase(db: Database.Database): void {
  const platformExists = db.prepare('SELECT id FROM platform_ai_config WHERE id = 1').get();
  if (!platformExists) {
    db.prepare(`
      INSERT INTO platform_ai_config (id, gemini_key, openai_key, text_provider, text_model, image_provider, image_model)
      VALUES (1, ?, ?, 'gemini', 'gemini-2.5-flash', 'gemini', 'gemini-2.5-flash-image')
    `).run(
      process.env.GEMINI_API_KEY || null,
      process.env.OPENAI_API_KEY || null
    );
  }

  const demoTenant = db.prepare('SELECT id FROM tenants WHERE id = ?').get(DEMO_TENANT_ID);
  if (!demoTenant) {
    db.prepare(
      'INSERT INTO tenants (id, name, plan, status) VALUES (?, ?, ?, ?)'
    ).run(DEMO_TENANT_ID, 'Demo Workspace', 'pro', 'active');

    db.prepare(`
      INSERT INTO tenant_ai_overrides (tenant_id, use_platform_keys)
      VALUES (?, 1)
    `).run(DEMO_TENANT_ID);
  }

  const integrationsExists = db.prepare('SELECT id FROM platform_integrations WHERE id = 1').get();
  if (!integrationsExists) {
    db.prepare(`
      INSERT INTO platform_integrations (id, facebook_app_id, facebook_app_secret, app_url)
      VALUES (1, ?, ?, ?)
    `).run(
      process.env.FACEBOOK_APP_ID || null,
      process.env.FACEBOOK_APP_SECRET || null,
      process.env.APP_URL || null
    );
  }
}
