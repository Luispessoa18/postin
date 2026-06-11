CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'pro' CHECK(plan IN ('basic', 'pro', 'agency')),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'trial')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS platform_ai_config (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  gemini_key TEXT,
  openai_key TEXT,
  text_provider TEXT NOT NULL DEFAULT 'gemini' CHECK(text_provider IN ('gemini', 'openai')),
  text_model TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
  image_provider TEXT NOT NULL DEFAULT 'gemini' CHECK(image_provider IN ('gemini', 'openai')),
  image_model TEXT NOT NULL DEFAULT 'gemini-2.5-flash-image',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tenant_ai_overrides (
  tenant_id TEXT PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  use_platform_keys INTEGER NOT NULL DEFAULT 1,
  gemini_key TEXT,
  openai_key TEXT,
  text_provider TEXT CHECK(text_provider IN ('gemini', 'openai')),
  text_model TEXT,
  image_provider TEXT CHECK(image_provider IN ('gemini', 'openai')),
  image_model TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS usage_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT REFERENCES tenants(id) ON DELETE SET NULL,
  operation TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_tenant ON usage_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created ON usage_logs(created_at);

CREATE TABLE IF NOT EXISTS platform_integrations (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  facebook_app_id TEXT,
  facebook_app_secret TEXT,
  app_url TEXT,
  cloudflare_tunnel_active INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
