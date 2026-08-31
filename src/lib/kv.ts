/**
 * KV helpers — typed wrappers for EARTHQUAKE_KV and FEATURE_FLAGS_KV bindings.
 * Functions accept the KV namespace binding from Astro.locals.runtime.env.
 */
// ── Key schema ────────────────────────────────────────────────────────────────

const KEYS = {
  feed:        (name: string) => `feed:${name}`,
  lastFeed:    (name: string) => `feed:last-known:${name}`,
  city:        (slug: string) => `city:${slug}`,
  aiSummary:   (quakeId: string) => `ai-summary:${quakeId}`,
  featureFlag: (key: string) => `flag:${key}`,
} as const;

// ── TTLs (seconds) ────────────────────────────────────────────────────────────

export const TTL = {
  FEED_HOUR:   65,       // slightly longer than 60s cron
  FEED_DAY:    300,      // 5 min
  FEED_WEEK:   600,      // 10 min
  CITY:        180,      // 3 min
  AI_SUMMARY:  3_600,    // 1 hr
  FEATURE_FLAG: 60,      // 1 min
} as const;

// ── Earthquake feed ───────────────────────────────────────────────────────────

export async function getEarthquakeFeed<T = unknown>(
  kv: KVNamespace,
  feed: 'all_hour' | 'all_day' | 'all_week',
): Promise<T | null> {
  const value = await kv.get(KEYS.feed(feed), 'json');
  return value as T | null;
}

export async function getLastKnownEarthquakeFeed<T = unknown>(
  kv: KVNamespace,
  feed: 'all_hour' | 'all_day' | 'all_week',
): Promise<T | null> {
  const value = await kv.get(KEYS.lastFeed(feed), 'json');
  return value as T | null;
}

export async function setEarthquakeFeed<T = unknown>(
  kv: KVNamespace,
  feed: 'all_hour' | 'all_day' | 'all_week',
  data: T,
  ttlSeconds?: number,
): Promise<void> {
  const ttl = ttlSeconds ?? (feed === 'all_hour' ? TTL.FEED_HOUR : feed === 'all_day' ? TTL.FEED_DAY : TTL.FEED_WEEK);
  const serialized = JSON.stringify(data);
  const [currentWrite, lastKnownWrite] = await Promise.allSettled([
    kv.put(KEYS.feed(feed), serialized, { expirationTtl: ttl }),
    kv.put(KEYS.lastFeed(feed), serialized),
  ]);
  if (lastKnownWrite.status === 'rejected') console.error('[kv] last-known feed write failed:', lastKnownWrite.reason);
  if (currentWrite.status === 'rejected') throw currentWrite.reason;
}

// ── City cache ────────────────────────────────────────────────────────────────

export async function getCityCache<T = unknown>(kv: KVNamespace, slug: string): Promise<T | null> {
  const value = await kv.get(KEYS.city(slug), 'json');
  return value as T | null;
}

export async function setCityCache<T = unknown>(kv: KVNamespace, slug: string, data: T): Promise<void> {
  await kv.put(KEYS.city(slug), JSON.stringify(data), { expirationTtl: TTL.CITY });
}

// ── AI Summary ────────────────────────────────────────────────────────────────

export async function getAISummary(kv: KVNamespace, quakeId: string): Promise<string | null> {
  return kv.get(KEYS.aiSummary(quakeId), 'text');
}

export async function setAISummary(kv: KVNamespace, quakeId: string, summary: string): Promise<void> {
  await kv.put(KEYS.aiSummary(quakeId), summary, { expirationTtl: TTL.AI_SUMMARY });
}

// ── Feature flags ─────────────────────────────────────────────────────────────

export async function getFeatureFlag(kv: KVNamespace, key: string): Promise<boolean> {
  const value = await kv.get(KEYS.featureFlag(key), 'text');
  return value === 'true';
}

export async function setFeatureFlag(kv: KVNamespace, key: string, enabled: boolean): Promise<void> {
  await kv.put(KEYS.featureFlag(key), String(enabled), { expirationTtl: TTL.FEATURE_FLAG });
}

export async function listFeatureFlags(kv: KVNamespace): Promise<Record<string, boolean>> {
  const list = await kv.list({ prefix: 'flag:' });
  const flags: Record<string, boolean> = {};
  await Promise.all(
    list.keys.map(async ({ name }) => {
      const key = name.replace(/^flag:/, '');
      flags[key] = await getFeatureFlag(kv, key);
    }),
  );
  return flags;
}
