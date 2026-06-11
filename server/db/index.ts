import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedDatabase } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export type AIProvider = 'gemini' | 'openai';
export type TenantPlan = 'basic' | 'pro' | 'agency';
export type TenantStatus = 'active' | 'suspended' | 'trial';

export interface Tenant {
  id: string;
  name: string;
  plan: TenantPlan;
  status: TenantStatus;
  created_at: string;
}

export interface PlatformAIConfig {
  gemini_key: string | null;
  openai_key: string | null;
  text_provider: AIProvider;
  text_model: string;
  image_provider: AIProvider;
  image_model: string;
  updated_at: string;
}

export interface TenantAIOverride {
  tenant_id: string;
  use_platform_keys: number;
  gemini_key: string | null;
  openai_key: string | null;
  text_provider: AIProvider | null;
  text_model: string | null;
  image_provider: AIProvider | null;
  image_model: string | null;
  updated_at: string;
}

export interface UsageLog {
  id: number;
  tenant_id: string | null;
  operation: string;
  provider: string;
  model: string;
  created_at: string;
}

export interface ResolvedAIConfig {
  provider: AIProvider;
  model: string;
  geminiKey: string | null;
  openaiKey: string | null;
}

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'marketing-ai.db');
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  db.exec(schema);
  seedDatabase(db);

  return db;
}

export function maskKey(key: string | null | undefined): string | null {
  if (!key || key.length < 8) return key ? '••••••••' : null;
  return key.slice(0, 4) + '••••' + key.slice(-4);
}

export function getPlatformConfig(): PlatformAIConfig {
  const database = getDb();
  const row = database.prepare('SELECT * FROM platform_ai_config WHERE id = 1').get() as PlatformAIConfig | undefined;
  if (!row) {
    throw new Error('Platform AI config not found');
  }
  return row;
}

export function updatePlatformConfig(updates: Partial<{
  gemini_key: string | null;
  openai_key: string | null;
  text_provider: AIProvider;
  text_model: string;
  image_provider: AIProvider;
  image_model: string;
}>): PlatformAIConfig {
  const database = getDb();
  const current = getPlatformConfig();

  const gemini_key = updates.gemini_key !== undefined
    ? (updates.gemini_key || null)
    : current.gemini_key;
  const openai_key = updates.openai_key !== undefined
    ? (updates.openai_key || null)
    : current.openai_key;

  database.prepare(`
    UPDATE platform_ai_config SET
      gemini_key = ?,
      openai_key = ?,
      text_provider = ?,
      text_model = ?,
      image_provider = ?,
      image_model = ?,
      updated_at = datetime('now')
    WHERE id = 1
  `).run(
    gemini_key,
    openai_key,
    updates.text_provider ?? current.text_provider,
    updates.text_model ?? current.text_model,
    updates.image_provider ?? current.image_provider,
    updates.image_model ?? current.image_model
  );

  return getPlatformConfig();
}

export function getTenantOverride(tenantId: string): TenantAIOverride | null {
  const database = getDb();
  return database.prepare('SELECT * FROM tenant_ai_overrides WHERE tenant_id = ?').get(tenantId) as TenantAIOverride | null;
}

export function upsertTenantOverride(tenantId: string, data: {
  use_platform_keys?: boolean;
  gemini_key?: string | null;
  openai_key?: string | null;
  text_provider?: AIProvider | null;
  text_model?: string | null;
  image_provider?: AIProvider | null;
  image_model?: string | null;
}): TenantAIOverride {
  const database = getDb();
  const existing = getTenantOverride(tenantId);

  if (existing) {
    const gemini_key = data.gemini_key !== undefined ? data.gemini_key : existing.gemini_key;
    const openai_key = data.openai_key !== undefined ? data.openai_key : existing.openai_key;

    database.prepare(`
      UPDATE tenant_ai_overrides SET
        use_platform_keys = ?,
        gemini_key = ?,
        openai_key = ?,
        text_provider = ?,
        text_model = ?,
        image_provider = ?,
        image_model = ?,
        updated_at = datetime('now')
      WHERE tenant_id = ?
    `).run(
      data.use_platform_keys !== undefined ? (data.use_platform_keys ? 1 : 0) : existing.use_platform_keys,
      gemini_key,
      openai_key,
      data.text_provider !== undefined ? data.text_provider : existing.text_provider,
      data.text_model !== undefined ? data.text_model : existing.text_model,
      data.image_provider !== undefined ? data.image_provider : existing.image_provider,
      data.image_model !== undefined ? data.image_model : existing.image_model,
      tenantId
    );
  } else {
    database.prepare(`
      INSERT INTO tenant_ai_overrides (
        tenant_id, use_platform_keys, gemini_key, openai_key,
        text_provider, text_model, image_provider, image_model
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      tenantId,
      data.use_platform_keys !== undefined ? (data.use_platform_keys ? 1 : 0) : 1,
      data.gemini_key ?? null,
      data.openai_key ?? null,
      data.text_provider ?? null,
      data.text_model ?? null,
      data.image_provider ?? null,
      data.image_model ?? null
    );
  }

  return getTenantOverride(tenantId)!;
}

export function resolveAIConfig(tenantId: string | undefined, task: 'text' | 'image'): ResolvedAIConfig {
  const platform = getPlatformConfig();
  const override = tenantId ? getTenantOverride(tenantId) : null;
  const usePlatform = !override || override.use_platform_keys === 1;

  const provider = (usePlatform
    ? (task === 'text' ? platform.text_provider : platform.image_provider)
    : (task === 'text' ? override!.text_provider : override!.image_provider)) ?? platform.text_provider;

  const model = (usePlatform
    ? (task === 'text' ? platform.text_model : platform.image_model)
    : (task === 'text' ? override!.text_model : override!.image_model)) ?? platform.text_model;

  let geminiKey = platform.gemini_key || process.env.GEMINI_API_KEY || null;
  let openaiKey = platform.openai_key || process.env.OPENAI_API_KEY || null;

  if (!usePlatform && override) {
    if (override.gemini_key) geminiKey = override.gemini_key;
    if (override.openai_key) openaiKey = override.openai_key;
  }

  return { provider, model, geminiKey, openaiKey };
}

export function logUsage(tenantId: string | undefined, operation: string, provider: string, model: string): void {
  const database = getDb();
  database.prepare(
    'INSERT INTO usage_logs (tenant_id, operation, provider, model) VALUES (?, ?, ?, ?)'
  ).run(tenantId ?? null, operation, provider, model);
}

export function getAllTenants(): Tenant[] {
  const database = getDb();
  return database.prepare('SELECT * FROM tenants ORDER BY created_at DESC').all() as Tenant[];
}

export function getTenantById(id: string): Tenant | null {
  const database = getDb();
  return database.prepare('SELECT * FROM tenants WHERE id = ?').get(id) as Tenant | null;
}

export function createTenant(data: { name: string; plan?: TenantPlan; status?: TenantStatus }): Tenant {
  const database = getDb();
  const id = `tenant_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  database.prepare(
    'INSERT INTO tenants (id, name, plan, status) VALUES (?, ?, ?, ?)'
  ).run(id, data.name, data.plan ?? 'pro', data.status ?? 'active');
  return getTenantById(id)!;
}

export function updateTenant(id: string, data: Partial<{ name: string; plan: TenantPlan; status: TenantStatus }>): Tenant | null {
  const database = getDb();
  const existing = getTenantById(id);
  if (!existing) return null;

  database.prepare(`
    UPDATE tenants SET name = ?, plan = ?, status = ? WHERE id = ?
  `).run(
    data.name ?? existing.name,
    data.plan ?? existing.plan,
    data.status ?? existing.status,
    id
  );
  return getTenantById(id);
}

export function deleteTenant(id: string): boolean {
  const database = getDb();
  const result = database.prepare('DELETE FROM tenants WHERE id = ?').run(id);
  return result.changes > 0;
}

export function getAdminStats() {
  const database = getDb();
  const totalTenants = (database.prepare('SELECT COUNT(*) as count FROM tenants').get() as { count: number }).count;
  const activeTenants = (database.prepare("SELECT COUNT(*) as count FROM tenants WHERE status = 'active'").get() as { count: number }).count;
  const usageToday = (database.prepare(
    "SELECT COUNT(*) as count FROM usage_logs WHERE date(created_at) = date('now')"
  ).get() as { count: number }).count;
  const usageByProvider = database.prepare(`
    SELECT provider, COUNT(*) as count FROM usage_logs GROUP BY provider
  `).all() as { provider: string; count: number }[];

  return { totalTenants, activeTenants, usageToday, usageByProvider };
}

export function getUsageLogs(limit = 50, offset = 0): UsageLog[] {
  const database = getDb();
  return database.prepare(
    'SELECT * FROM usage_logs ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(limit, offset) as UsageLog[];
}

export { DEMO_TENANT_ID } from './constants.js';
