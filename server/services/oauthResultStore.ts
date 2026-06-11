const TTL_MS = 10 * 60 * 1000;

interface OAuthResultEntry {
  profiles: unknown[];
  expiresAt: number;
}

const store = new Map<string, OAuthResultEntry>();

function purgeExpired() {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) store.delete(key);
  }
}

export function saveOAuthResult(state: string, profiles: unknown[]) {
  if (!state) return;
  purgeExpired();
  store.set(state, { profiles, expiresAt: Date.now() + TTL_MS });
}

export function peekOAuthResult(state: string): unknown[] | null {
  if (!state) return null;
  purgeExpired();
  const entry = store.get(state);
  if (!entry || entry.expiresAt <= Date.now()) {
    store.delete(state);
    return null;
  }
  return entry.profiles;
}

export function consumeOAuthResult(state: string): unknown[] | null {
  const profiles = peekOAuthResult(state);
  if (profiles) store.delete(state);
  return profiles;
}
